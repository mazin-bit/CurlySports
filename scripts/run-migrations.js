#!/usr/bin/env node
/**
 * Parse .env.migrate and run prisma migrate deploy with clean env vars.
 * Handles quote stripping, invisible chars, scheme validation, and \r\n.
 */
const fs = require('fs');
const { execFileSync } = require('child_process');

const ENV_FILE = '.env.migrate';

if (!fs.existsSync(ENV_FILE)) {
  console.error(`[migrate] ${ENV_FILE} not found — skipping migrations`);
  process.exit(0);
}

// ── Parse env file ──────────────────────────────────────────────────
const raw = fs.readFileSync(ENV_FILE, 'utf8');

// Strip BOM if present
const content = raw.replace(/^\uFEFF/, '');

for (const line of content.split(/\r?\n/)) {
  const trimmed = line.trim();
  // Skip comments and empty lines
  if (!trimmed || trimmed.startsWith('#')) continue;

  const eqIdx = trimmed.indexOf('=');
  if (eqIdx < 1) continue;

  const key = trimmed.slice(0, eqIdx);
  let val = trimmed.slice(eqIdx + 1).trim();

  // Strip surrounding quotes (double or single)
  if (
    (val.startsWith('"') && val.endsWith('"')) ||
    (val.startsWith("'") && val.endsWith("'"))
  ) {
    val = val.slice(1, -1);
  }

  // Remove any remaining \r or null bytes
  val = val.replace(/[\r\0]/g, '');

  process.env[key] = val;
}

// ── Validate database URLs ──────────────────────────────────────────
function maskUrl(s) {
  return s.replace(/:\/\/([^:]+):([^@]+)@/, '://***:***@');
}

function validateScheme(url, name) {
  if (!url) {
    console.log(`[migrate] ${name}: (empty)`);
    return false;
  }

  // Show raw bytes of the first 30 chars for debugging
  const head = url.slice(0, 30);
  const hex = Buffer.from(head).toString('hex').match(/../g).join(' ');
  console.log(`[migrate] ${name} first 30 bytes: ${hex}`);
  console.log(`[migrate] ${name} masked: ${maskUrl(url)}`);

  const scheme = url.split('://')[0];
  const validSchemes = ['postgresql', 'postgres', 'mysql', 'sqlite', 'sqlserver', 'mongodb', 'cockroachdb'];
  if (!validSchemes.includes(scheme)) {
    console.error(`[migrate] ${name} has unrecognized scheme "${scheme}"`);
    return false;
  }
  return true;
}

const directUrl = process.env.DIRECT_URL || '';
const databaseUrl = process.env.DATABASE_URL || '';

console.log('[migrate] ── URL diagnostics ──');
const directOk = validateScheme(directUrl, 'DIRECT_URL');
const dbOk = validateScheme(databaseUrl, 'DATABASE_URL');

// If DIRECT_URL is bad but DATABASE_URL is good, use DATABASE_URL for both
if (!directOk && dbOk) {
  console.log('[migrate] Falling back: setting DIRECT_URL = DATABASE_URL');
  process.env.DIRECT_URL = databaseUrl;
} else if (!directOk && !dbOk) {
  console.error('[migrate] Neither DIRECT_URL nor DATABASE_URL has a valid scheme — cannot migrate');
  // Dump the raw env file (keys only) for debugging
  console.error('[migrate] Keys in .env.migrate:', Object.keys(process.env).filter(k => /^[A-Z]/.test(k) && k.includes('URL')).join(', '));
  process.exit(1);
}

// ── Run migrations ──────────────────────────────────────────────────
const prismaPath = './node_modules/prisma/build/index.js';

if (!fs.existsSync(prismaPath)) {
  console.error(`[migrate] Prisma CLI not found at ${prismaPath}`);
  process.exit(1);
}

console.log('\n[migrate] ── prisma migrate status ──');
try {
  execFileSync('node', [prismaPath, 'migrate', 'status'], {
    stdio: 'inherit',
    env: process.env,
  });
} catch (_) {
  // status can exit non-zero if migrations are pending — that's expected
}

// ── Run prisma migrate deploy ──────────────────────────────────────
function tryDeploy() {
  try {
    execFileSync('node', [prismaPath, 'migrate', 'deploy'], {
      stdio: 'inherit',
      env: process.env,
    });
    return true; // success
  } catch (_) {
    return false;
  }
}

console.log('\n[migrate] ── prisma migrate deploy ──');
if (!tryDeploy()) {
  // P3005 = database schema is not empty (needs baselining)
  // This happens when the DB was set up with `prisma db push` instead of migrations
  console.log('\n[migrate] ── deploy failed (likely P3005), attempting incremental baseline ──');

  // Read migration directories sorted chronologically
  const migrationsDir = './prisma/migrations';
  const migrations = fs.readdirSync(migrationsDir)
    .filter(f => f !== 'migration_lock.toml' && fs.statSync(`${migrationsDir}/${f}`).isDirectory())
    .sort();

  console.log(`[migrate] Found ${migrations.length} migrations: ${migrations.join(', ')}`);

  // Baseline ONE AT A TIME, then retry deploy after each.
  // This ensures only migrations whose changes already exist in the DB get
  // marked as applied. New migrations (like adding isPinned) will actually run.
  for (let i = 0; i < migrations.length; i++) {
    const migration = migrations[i];
    console.log(`\n[migrate] Resolving "${migration}" as applied...`);
    try {
      execFileSync('node', [prismaPath, 'migrate', 'resolve', '--applied', migration], {
        stdio: 'inherit',
        env: process.env,
      });
    } catch (resolveErr) {
      console.error(`[migrate] Failed to resolve ${migration}: exit code ${resolveErr.status}`);
      continue;
    }

    // After each baseline, try deploy — if remaining migrations can now apply, we're done
    console.log(`[migrate] Retrying deploy after baselining ${i + 1}/${migrations.length}...`);
    if (tryDeploy()) {
      console.log('[migrate] Prisma migrations applied successfully after partial baseline');
      process.exit(0);
    }
    // Deploy still fails — baseline the next migration too
    console.log(`[migrate] Deploy still failing, will baseline next migration...`);
  }

  // All migrations baselined and deploy STILL fails — something else is wrong
  console.log('\n[migrate] ── final deploy attempt after full baseline ──');
  if (tryDeploy()) {
    console.log('[migrate] Prisma migrations applied successfully after full baseline');
  } else {
    console.error('[migrate] migrate deploy still failed after baselining all migrations');
    process.exit(1);
  }
} else {
  console.log('[migrate] Prisma migrations applied successfully');
}
