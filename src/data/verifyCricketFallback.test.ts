// @ts-nocheck
/**
 * Verification test: every cricket league has data for every season from 2008 (or league start) to current.
 * Pre-start years may return a single-row placeholder. T20 World Cup has knockout grid (semis + final) for every edition.
 */
import { getCricketStandingsFallback } from './cricketStandingsFallback';
import { getCricketKnockoutFallback } from './cricketKnockoutFallback';

const currentYear = new Date().getFullYear();
const LEAGUE_YEARS = {
  ipl: { start: 2008, end: Math.max(currentYear + 1, 2025) },
  psl: { start: 2008, end: Math.max(currentYear + 1, 2025) },
  bbl: { start: 2008, end: Math.max(currentYear, 2025) },
  ilt20: { start: 2008, end: Math.max(currentYear + 1, 2025) },
  sa20: { start: 2008, end: Math.max(currentYear + 1, 2025) },
  ranji: { start: 2008, end: Math.max(currentYear, 2024) },
  sheffield: { start: 2008, end: Math.max(currentYear, 2024) },
  county: { start: 2008, end: Math.max(currentYear, 2024) },
  icc_test: { start: 2008, end: 2025 },
  t20wc: { start: 2007, end: 2024, years: [2007, 2009, 2010, 2012, 2014, 2016, 2021, 2022, 2024] }
};

describe('Cricket standings fallback', () => {
  it('has data for every year from 2008 (or league start) to current for each league', () => {
    for (const [key, cfg] of Object.entries(LEAGUE_YEARS)) {
      const years = cfg.years || (() => {
        const r = [];
        for (let y = cfg.start; y <= cfg.end; y++) r.push(y);
        return r;
      })();
      for (const y of years) {
        const t = getCricketStandingsFallback(key, y);
        expect(t).not.toBeNull();
        expect(t?.rows).toBeDefined();
        expect(Array.isArray(t?.rows)).toBe(true);
        expect(t?.rows?.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('T20 World Cup knockout fallback', () => {
  const t20Years = LEAGUE_YEARS.t20wc.years;
  it.each(t20Years)('T20 WC %i has semis and final', (year) => {
    const matches = getCricketKnockoutFallback('t20wc', year);
    expect(matches.length).toBeGreaterThanOrEqual(3);
    expect(matches.some(m => /Semi/i.test(m.round))).toBe(true);
    expect(matches.some(m => /Final/i.test(m.round))).toBe(true);
  });
});
