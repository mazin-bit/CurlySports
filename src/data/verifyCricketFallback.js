/**
 * Verification: every cricket league has every season from 2008 (or league start) to current.
 * Run: npm run verify-fallback
 * Or: node --experimental-vm-modules src/data/verifyCricketFallback.js (if Node ESM is available)
 */

import { getCricketStandingsFallback } from './cricketStandingsFallback.js';
import { getCricketKnockoutFallback } from './cricketKnockoutFallback.js';

const LEAGUE_YEARS = {
  ipl: { start: 2008, end: 2025 },
  psl: { start: 2016, end: 2025 },
  bbl: { start: 2012, end: 2024 },
  ilt20: { start: 2023, end: 2025 },
  sa20: { start: 2023, end: 2025 },
  ranji: { start: 2008, end: 2024 },
  sheffield: { start: 2008, end: 2024 },
  county: { start: 2008, end: 2024 },
  icc_test: { start: 2021, end: 2025, years: [2021, 2023, 2025] },
  t20wc: { start: 2007, end: 2024, years: [2007, 2009, 2010, 2012, 2014, 2016, 2021, 2022, 2024] }
};

let ok = true;
console.log('=== Standings fallback coverage ===\n');

for (const [key, cfg] of Object.entries(LEAGUE_YEARS)) {
  const years = cfg.years || (() => { const r = []; for (let y = cfg.start; y <= cfg.end; y++) r.push(y); return r; })();
  const missing = [];
  for (const y of years) {
    const t = getCricketStandingsFallback(key, y);
    if (!t || !t.rows || t.rows.length === 0) missing.push(y);
  }
  if (missing.length) {
    console.log(`${key}: MISSING years ${missing.join(', ')}`);
    ok = false;
  } else {
    console.log(`${key}: OK (${years.length} seasons ${years[0]}-${years[years.length - 1]})`);
  }
}

console.log('\n=== T20 WC Knockout grid (every edition) ===\n');
const t20Years = LEAGUE_YEARS.t20wc.years;
for (const y of t20Years) {
  const matches = getCricketKnockoutFallback('t20wc', y);
  const hasSemis = matches.some(m => /Semi/i.test(m.round));
  const hasFinal = matches.some(m => /Final/i.test(m.round));
  if (matches.length >= 3 && hasSemis && hasFinal) {
    console.log(`T20 WC ${y}: OK (${matches.length} knockout matches)`);
  } else {
    console.log(`T20 WC ${y}: MISSING or incomplete knockout (got ${matches.length} matches)`);
    ok = false;
  }
}

console.log(ok ? '\n✓ All leagues have every year and T20 WC has knockout grid.' : '\n✗ Some gaps - see above.');
process.exit(ok ? 0 : 1);
