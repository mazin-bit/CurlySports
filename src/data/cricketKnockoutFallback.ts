// @ts-nocheck
/**
 * Fallback knockout matches (semi-finals, final) for cricket when ESPN returns none (e.g. past T20 World Cups).
 */

const DEFAULT_LOGO = 'https://via.placeholder.com/48?text=Team';

function match(home, away, homeScore, awayScore, winner, round, dateStr = '') {
  return {
    id: `fallback-${round}-${home}-${away}`,
    leagueCode: '',
    league: '',
    home,
    away,
    homeScore: String(homeScore),
    awayScore: String(awayScore),
    time: dateStr,
    rawDate: null,
    isLive: false,
    isCompleted: true,
    status: 'Final',
    statusDetail: 'Final',
    homeLogo: DEFAULT_LOGO,
    awayLogo: DEFAULT_LOGO,
    winner: winner === 'home' ? 'home' : winner === 'away' ? 'away' : null,
    round
  };
}

/** T20 World Cup knockout matches by year. */
const T20WC_KNOCKOUT = {
  2007: [
    match('Pakistan', 'New Zealand', 149, 142, 'home', 'Semi-Final 1', 'Sep 22, 2007'),
    match('India', 'Australia', 188, 173, 'home', 'Semi-Final 2', 'Sep 22, 2007'),
    match('India', 'Pakistan', 157, 152, 'home', 'Final', 'Sep 24, 2007')
  ],
  2009: [
    match('Pakistan', 'South Africa', 149, 142, 'home', 'Semi-Final 1', 'Jun 18, 2009'),
    match('Sri Lanka', 'West Indies', 158, 101, 'home', 'Semi-Final 2', 'Jun 19, 2009'),
    match('Pakistan', 'Sri Lanka', 139, 138, 'home', 'Final', 'Jun 21, 2009')
  ],
  2010: [
    match('Australia', 'Pakistan', 197, 191, 'home', 'Semi-Final 1', 'May 14, 2010'),
    match('England', 'Sri Lanka', 127, 128, 'away', 'Semi-Final 2', 'May 13, 2010'),
    match('England', 'Australia', 148, 147, 'home', 'Final', 'May 16, 2010')
  ],
  2012: [
    match('West Indies', 'Australia', 205, 131, 'home', 'Semi-Final 1', 'Oct 5, 2012'),
    match('Sri Lanka', 'Pakistan', 139, 123, 'home', 'Semi-Final 2', 'Oct 4, 2012'),
    match('West Indies', 'Sri Lanka', 137, 101, 'home', 'Final', 'Oct 7, 2012')
  ],
  2014: [
    match('Sri Lanka', 'West Indies', 160, 80, 'home', 'Semi-Final 1', 'Apr 3, 2014'),
    match('India', 'South Africa', 176, 172, 'home', 'Semi-Final 2', 'Apr 4, 2014'),
    match('Sri Lanka', 'India', 134, 130, 'away', 'Final', 'Apr 6, 2014')
  ],
  2016: [
    match('West Indies', 'India', 196, 192, 'home', 'Semi-Final 1', 'Mar 31, 2016'),
    match('England', 'New Zealand', 159, 153, 'home', 'Semi-Final 2', 'Mar 30, 2016'),
    match('West Indies', 'England', 161, 155, 'home', 'Final', 'Apr 3, 2016')
  ],
  2021: [
    match('Pakistan', 'Australia', 176, 177, 'away', 'Semi-Final 1', 'Nov 11, 2021'),
    match('New Zealand', 'England', 167, 166, 'home', 'Semi-Final 2', 'Nov 10, 2021'),
    match('Australia', 'New Zealand', 173, 172, 'home', 'Final', 'Nov 14, 2021')
  ],
  2022: [
    match('Pakistan', 'New Zealand', 153, 152, 'home', 'Semi-Final 1', 'Nov 9, 2022'),
    match('England', 'India', 170, 168, 'home', 'Semi-Final 2', 'Nov 10, 2022'),
    match('England', 'Pakistan', 138, 137, 'home', 'Final', 'Nov 13, 2022')
  ],
  2024: [
    match('India', 'England', 171, 103, 'home', 'Semi-Final 1', 'Jun 27, 2024'),
    match('South Africa', 'Afghanistan', 60, 56, 'home', 'Semi-Final 2', 'Jun 26, 2024'),
    match('India', 'South Africa', 176, 169, 'home', 'Final', 'Jun 29, 2024')
  ],
  // 2026: scheduled for later; no results yet — API or empty state used
  2026: []
};

const KNOCKOUT_BY_LEAGUE = { t20wc: T20WC_KNOCKOUT };

/**
 * Returns fallback knockout matches for a cricket league and season, or empty array.
 */
export function getCricketKnockoutFallback(leagueKey, seasonYear) {
  const league = KNOCKOUT_BY_LEAGUE[leagueKey];
  if (!league || !seasonYear) return [];
  return league[seasonYear] || [];
}
