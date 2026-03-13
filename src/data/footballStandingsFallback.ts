// @ts-nocheck
/**
 * Fallback standings for football (soccer) leagues — data since 2008–09 season.
 * Season year = end year (e.g. 2009 = 2008–09). Data from Wikipedia and official sources.
 * Structure matches App.js: { columns, rows } with row = { pos, team, logo, values: { GP, W, D, L, GD, P } }.
 */

const FOOTBALL_COLUMNS = ['GP', 'W', 'D', 'L', 'GD', 'P'];
const DEFAULT_LOGO = 'https://via.placeholder.com/48?text=Team';

function row(pos, team, gp, w, d, l, gd, p) {
  return {
    pos: String(pos),
    team,
    logo: DEFAULT_LOGO,
    values: {
      GP: String(gp),
      W: String(w),
      D: String(d),
      L: String(l),
      GD: String(gd),
      P: String(p)
    }
  };
}

/** First season end-year for each league (2009 = 2008–09). */
const LEAGUE_START_YEAR = {
  pl: 2009,
  laliga: 2009,
  bundesliga: 2009,
  seriea: 2009,
  ligue1: 2009,
  eredivisie: 2009
};

/** Leagues that support historical season selector (domestic leagues only; UCL shows current year only). */
export const FOOTBALL_LEAGUES_WITH_HISTORY = ['pl', 'laliga', 'bundesliga', 'seriea', 'ligue1', 'eredivisie'];

const STANDINGS = {
  pl: {
    2009: {
      columns: FOOTBALL_COLUMNS,
      rows: [
        row(1, 'Manchester United', 38, 28, 6, 4, 44, 90),
        row(2, 'Liverpool', 38, 25, 11, 2, 50, 86),
        row(3, 'Chelsea', 38, 25, 8, 5, 44, 83),
        row(4, 'Arsenal', 38, 20, 12, 6, 31, 72),
        row(5, 'Everton', 38, 17, 12, 9, 18, 63),
        row(6, 'Aston Villa', 38, 17, 11, 10, 6, 62),
        row(7, 'Fulham', 38, 14, 11, 13, 5, 53),
        row(8, 'Tottenham Hotspur', 38, 14, 9, 15, 0, 51),
        row(9, 'West Ham United', 38, 14, 9, 15, -3, 51),
        row(10, 'Manchester City', 38, 15, 5, 18, 8, 50),
        row(11, 'Wigan Athletic', 38, 12, 9, 17, -11, 45),
        row(12, 'Stoke City', 38, 12, 9, 17, -17, 45),
        row(13, 'Bolton Wanderers', 38, 11, 8, 19, -12, 41),
        row(14, 'Portsmouth', 38, 10, 11, 17, -19, 41),
        row(15, 'Blackburn Rovers', 38, 10, 11, 17, -20, 41),
        row(16, 'Sunderland', 38, 9, 9, 20, -20, 36),
        row(17, 'Hull City', 38, 8, 11, 19, -25, 35),
        row(18, 'Newcastle United', 38, 7, 13, 18, -19, 34),
        row(19, 'Middlesbrough', 38, 7, 11, 20, -29, 32),
        row(20, 'West Bromwich Albion', 38, 8, 8, 22, -31, 32)
      ]
    }
  },
  laliga: {
    2009: {
      columns: FOOTBALL_COLUMNS,
      rows: [
        row(1, 'Barcelona', 38, 27, 6, 5, 70, 87),
        row(2, 'Real Madrid', 38, 25, 3, 10, 31, 78),
        row(3, 'Sevilla', 38, 21, 7, 10, 15, 70),
        row(4, 'Atlético Madrid', 38, 20, 7, 11, 23, 67),
        row(5, 'Villarreal', 38, 18, 11, 9, 7, 65),
        row(6, 'Valencia', 38, 18, 8, 12, 14, 62),
        row(7, 'Deportivo La Coruña', 38, 16, 10, 12, 1, 58),
        row(8, 'Málaga', 38, 15, 10, 13, -4, 55),
        row(9, 'Mallorca', 38, 14, 9, 15, -7, 51),
        row(10, 'Espanyol', 38, 12, 11, 15, -3, 47),
        row(11, 'Almería', 38, 13, 7, 18, -16, 46),
        row(12, 'Racing Santander', 38, 12, 10, 16, 1, 46),
        row(13, 'Athletic Bilbao', 38, 12, 8, 18, -15, 44),
        row(14, 'Sporting Gijón', 38, 14, 1, 23, -32, 43),
        row(15, 'Osasuna', 38, 10, 13, 15, -6, 43),
        row(16, 'Valladolid', 38, 12, 7, 19, -12, 43),
        row(17, 'Getafe', 38, 10, 12, 16, -6, 42),
        row(18, 'Real Betis', 38, 10, 12, 16, -7, 42),
        row(19, 'Numancia', 38, 10, 5, 23, -31, 35),
        row(20, 'Recreativo Huelva', 38, 8, 9, 21, -23, 33)
      ]
    }
  },
  bundesliga: {
    2009: {
      columns: FOOTBALL_COLUMNS,
      rows: [
        row(1, 'VfL Wolfsburg', 34, 21, 6, 7, 36, 69),
        row(2, 'Bayern Munich', 34, 20, 7, 7, 38, 67),
        row(3, 'VfB Stuttgart', 34, 19, 6, 9, 18, 63),
        row(4, 'Hertha BSC', 34, 19, 6, 9, 10, 63),
        row(5, 'Hamburger SV', 34, 19, 4, 11, 14, 61),
        row(6, 'Borussia Dortmund', 34, 15, 14, 5, 17, 59),
        row(7, '1899 Hoffenheim', 34, 15, 10, 9, 14, 55),
        row(8, 'Schalke 04', 34, 14, 8, 12, 5, 50),
        row(9, 'Bayer Leverkusen', 34, 14, 7, 13, 2, 49),
        row(10, 'Werder Bremen', 34, 12, 10, 12, -5, 46),
        row(11, 'Hannover 96', 34, 10, 10, 14, -9, 40),
        row(12, '1. FC Köln', 34, 11, 6, 17, -17, 39),
        row(13, 'Eintracht Frankfurt', 34, 8, 9, 17, -21, 33),
        row(14, 'VfL Bochum', 34, 7, 11, 16, -22, 32),
        row(15, 'Borussia Mönchengladbach', 34, 8, 7, 19, -23, 31),
        row(16, 'Energie Cottbus', 34, 7, 9, 18, -29, 30),
        row(17, 'Karlsruher SC', 34, 8, 6, 20, -28, 30),
        row(18, 'Arminia Bielefeld', 34, 4, 16, 14, -24, 28)
      ]
    }
  },
  seriea: {
    2009: {
      columns: FOOTBALL_COLUMNS,
      rows: [
        row(1, 'Inter Milan', 38, 25, 9, 4, 39, 84),
        row(2, 'Juventus', 38, 21, 11, 6, 30, 74),
        row(3, 'AC Milan', 38, 22, 8, 8, 28, 74),
        row(4, 'Fiorentina', 38, 21, 5, 12, 14, 68),
        row(5, 'Genoa', 38, 19, 11, 8, 18, 68),
        row(6, 'Roma', 38, 18, 9, 11, 8, 63),
        row(7, 'Udinese', 38, 16, 10, 12, 3, 58),
        row(8, 'Palermo', 38, 17, 6, 15, 1, 57),
        row(9, 'Cagliari', 38, 15, 8, 15, 0, 53),
        row(10, 'Lazio', 38, 15, 5, 18, -4, 50),
        row(11, 'Atalanta', 38, 13, 8, 17, -11, 47),
        row(12, 'Napoli', 38, 12, 10, 16, -1, 46),
        row(13, 'Sampdoria', 38, 11, 13, 14, -2, 46),
        row(14, 'Siena', 38, 12, 8, 18, -15, 44),
        row(15, 'Catania', 38, 12, 8, 18, -17, 44),
        row(16, 'Chievo', 38, 8, 14, 16, -18, 38),
        row(17, 'Bologna', 38, 9, 10, 19, -25, 37),
        row(18, 'Torino', 38, 8, 10, 20, -24, 34),
        row(19, 'Reggina', 38, 6, 13, 19, -28, 31),
        row(20, 'Lecce', 38, 5, 15, 18, -28, 30)
      ]
    }
  },
  ligue1: {
    2009: {
      columns: FOOTBALL_COLUMNS,
      rows: [
        row(1, 'Bordeaux', 38, 24, 8, 6, 34, 80),
        row(2, 'Marseille', 38, 22, 11, 5, 26, 77),
        row(3, 'Lyon', 38, 20, 12, 6, 24, 72),
        row(4, 'Toulouse', 38, 16, 16, 6, 13, 64),
        row(5, 'Lille', 38, 17, 13, 8, 18, 64),
        row(6, 'Paris Saint-Germain', 38, 15, 15, 8, 10, 60),
        row(7, 'Rennes', 38, 15, 10, 13, 1, 55),
        row(8, 'Auxerre', 38, 13, 11, 14, -8, 50),
        row(9, 'Nice', 38, 13, 11, 14, -5, 50),
        row(10, 'Lorient', 38, 10, 15, 13, -8, 45),
        row(11, 'Monaco', 38, 11, 12, 15, -10, 45),
        row(12, 'Valenciennes', 38, 10, 14, 14, -7, 44),
        row(13, 'Grenoble', 38, 10, 14, 14, -9, 44),
        row(14, 'Sochaux', 38, 10, 12, 16, -14, 42),
        row(15, 'Nancy', 38, 10, 12, 16, -15, 42),
        row(16, 'Le Mans', 38, 10, 10, 18, -15, 40),
        row(17, 'Saint-Étienne', 38, 11, 8, 19, -24, 41),
        row(18, 'Caen', 38, 8, 13, 17, -18, 37),
        row(19, 'Nantes', 38, 9, 10, 19, -19, 37),
        row(20, 'Le Havre', 38, 7, 5, 26, -32, 26)
      ]
    }
  },
  eredivisie: {
    2009: {
      columns: FOOTBALL_COLUMNS,
      rows: [
        row(1, 'AZ', 34, 25, 5, 4, 66, 80),
        row(2, 'Twente', 34, 20, 9, 5, 35, 69),
        row(3, 'Ajax', 34, 21, 5, 8, 40, 68),
        row(4, 'PSV Eindhoven', 34, 19, 8, 7, 31, 65),
        row(5, 'SC Heerenveen', 34, 17, 9, 8, 16, 60),
        row(6, 'Groningen', 34, 16, 6, 12, 2, 54),
        row(7, 'Feyenoord', 34, 12, 14, 8, 4, 50),
        row(8, 'NAC Breda', 34, 13, 9, 12, -2, 48),
        row(9, 'Utrecht', 34, 12, 11, 11, 2, 47),
        row(10, 'Vitesse', 34, 12, 8, 14, -8, 44),
        row(11, 'Heracles Almelo', 34, 11, 7, 16, -18, 40),
        row(12, 'NEC Nijmegen', 34, 10, 9, 15, -14, 39),
        row(13, 'Roda JC', 34, 10, 9, 15, -12, 39),
        row(14, 'Sparta Rotterdam', 34, 8, 11, 15, -18, 35),
        row(15, 'Willem II', 34, 7, 9, 18, -28, 30),
        row(16, 'De Graafschap', 34, 7, 8, 19, -32, 29),
        row(17, 'Volendam', 34, 6, 10, 18, -35, 28),
        row(18, 'ADO Den Haag', 34, 5, 12, 17, -26, 27)
      ]
    }
  }
};

/**
 * Returns fallback standings for a football league and season (end year), or null if not available.
 * For UCL returns { columns, rows, conferences } with one conference per group.
 * @param {string} leagueKey - e.g. 'pl', 'laliga', 'ucl', ...
 * @param {number} seasonYear - season end year (e.g. 2009 = 2008–09)
 */
export function getFootballStandingsFallback(leagueKey, seasonYear) {
  const byLeague = STANDINGS[leagueKey];
  if (!byLeague) return null;
  const table = byLeague[seasonYear];
  const hasRows = table?.rows?.length > 0;
  const hasConferences = table?.conferences?.length > 0;
  return (table && (hasRows || hasConferences)) ? table : null;
}

/**
 * Returns the list of season years for the football season selector (2009 through current+1).
 * @param {string} leagueKey
 */
export function getFootballSeasonYears(leagueKey) {
  const start = LEAGUE_START_YEAR[leagueKey];
  if (start == null) return [];
  const maxYear = new Date().getFullYear() + 1;
  const years = [];
  for (let y = maxYear; y >= start; y--) years.push(y);
  return years;
}
