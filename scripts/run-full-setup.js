/**
 * Run supabase/full-setup.sql against the database using DIRECT_URL from .env.
 * Usage: yarn db:setup   (or: node scripts/run-full-setup.js)
 * Requires DIRECT_URL in .env with valid Supabase DB credentials.
 */
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env manually (no dotenv dep)
try {
  const envPath = join(__dirname, '..', '.env');
  const env = readFileSync(envPath, 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*"(.*)"\s*$/);
    if (m) process.env[m[1]] = m[2].replace(/\\(.)/g, '$1');
    const u = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.+)\s*$/);
    if (u && !u[2].startsWith('"') && !line.trim().startsWith('#')) process.env[u[1]] = u[2].trim();
  }
} catch (e) {
  console.warn('No .env found, using process.env');
}

const directUrl = process.env.DIRECT_URL;
if (!directUrl) {
  console.error('DIRECT_URL is not set in .env');
  process.exit(1);
}

const sqlPath = join(__dirname, '..', 'supabase', 'full-setup.sql');
const sql = readFileSync(sqlPath, 'utf8');

async function main() {
  const client = new pg.Client({
    connectionString: directUrl,
    ssl: { rejectUnauthorized: false }, // Supabase pooler cert chain
  });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Done. Tables, seed, and RLS applied.');
  } catch (e) {
    console.error(e.message || e);
    if ((e.message || '').toLowerCase().includes('password authentication failed')) {
      console.error('\nFix: Update DIRECT_URL in .env with the correct DB password from Supabase Dashboard → Settings → Database.');
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
