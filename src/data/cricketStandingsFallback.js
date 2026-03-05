/**
 * Fallback standings for cricket leagues when ESPN returns zeros (common for historical seasons).
 * Data from public sources: Wikipedia, ESPNcricinfo, IPLT20, etc.
 * Structure matches App.js table rows: { pos, team, logo, values: { M, W, L, 'N/R', NRR, PT } }.
 */

const CRICKET_COLUMNS = ['M', 'W', 'L', 'N/R', 'NRR', 'PT'];
const DEFAULT_LOGO = 'https://via.placeholder.com/48?text=Team';
const ESPN_LOGO = (id) => `https://a.espncdn.com/i/teamlogos/cricket/500/${id}.png`;

const TEAM_IDS = {
  'Chennai Super Kings': 335974,
  'Delhi Capitals': 335975,
  'Delhi Daredevils': 335975,
  'Kolkata Knight Riders': 335971,
  'Mumbai Indians': 335978,
  'Punjab Kings': 335973,
  'Kings XI Punjab': 335973,
  'Rajasthan Royals': 335977,
  'Royal Challengers Bangalore': 335970,
  'Royal Challengers Bengaluru': 335970,
  'Sunrisers Hyderabad': 628333,
  'Gujarat Titans': 1298769,
  'Lucknow Super Giants': 1298768,
};

function row(pos, team, m, w, l, nr, nrr, pt) {
  const logo = TEAM_IDS[team] ? ESPN_LOGO(TEAM_IDS[team]) : DEFAULT_LOGO;
  return {
    pos: String(pos),
    team,
    logo,
    values: { M: String(m), W: String(w), L: String(l), 'N/R': String(nr), NRR: String(nrr), PT: String(pt) }
  };
}

/** For international/other teams (no ESPN franchise id); uses default logo. */
function rowIntl(pos, team, m, w, l, nr, nrr, pt) {
  return {
    pos: String(pos),
    team,
    logo: DEFAULT_LOGO,
    values: { M: String(m), W: String(w), L: String(l), 'N/R': String(nr), NRR: String(nrr), PT: String(pt) }
  };
}

/** Single-row placeholder when a league had no season in that year (e.g. before league started). */
function placeholderTable(message) {
  return {
    columns: CRICKET_COLUMNS,
    rows: [rowIntl(1, message, 0, 0, 0, 0, '—', 0)]
  };
}

/** First season year for each league (so we can return placeholder for 2008..start-1). */
const LEAGUE_START_YEAR = {
  ipl: 2008,
  psl: 2016,
  bbl: 2012,
  ilt20: 2023,
  sa20: 2023,
  ranji: 2008,
  sheffield: 2008,
  county: 2008,
  icc_test: 2021,
  t20wc: 2007
};

const IPL = {
  2008: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Rajasthan Royals', 14, 11, 3, 0, '0.632', 22),
      row(2, 'Kings XI Punjab', 14, 10, 4, 0, '0.509', 20),
      row(3, 'Chennai Super Kings', 14, 8, 6, 0, '-0.192', 16),
      row(4, 'Delhi Daredevils', 14, 7, 6, 1, '0.342', 15),
      row(5, 'Mumbai Indians', 14, 7, 7, 0, '0.570', 14),
      row(6, 'Kolkata Knight Riders', 14, 6, 7, 1, '-0.147', 13),
      row(7, 'Royal Challengers Bangalore', 14, 4, 10, 0, '-1.160', 8),
      row(8, 'Deccan Chargers', 14, 2, 12, 0, '-0.467', 4)
    ]
  },
  2009: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Delhi Daredevils', 14, 10, 4, 0, '0.311', 20),
      row(2, 'Chennai Super Kings', 14, 8, 5, 0, '0.951', 17),
      row(3, 'Royal Challengers Bangalore', 14, 8, 6, 0, '-0.191', 16),
      row(4, 'Deccan Chargers', 14, 7, 7, 0, '0.203', 14),
      row(5, 'Kings XI Punjab', 14, 7, 7, 0, '-0.483', 14),
      row(6, 'Rajasthan Royals', 14, 6, 7, 0, '-0.352', 13),
      row(7, 'Mumbai Indians', 14, 5, 8, 0, '0.297', 11),
      row(8, 'Kolkata Knight Riders', 14, 3, 10, 0, '-0.789', 7)
    ]
  },
  2010: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Mumbai Indians', 14, 10, 4, 0, '1.084', 20),
      row(2, 'Deccan Chargers', 14, 8, 6, 0, '-0.297', 16),
      row(3, 'Chennai Super Kings', 14, 7, 7, 0, '0.274', 14),
      row(4, 'Royal Challengers Bangalore', 14, 7, 7, 0, '0.219', 14),
      row(5, 'Delhi Daredevils', 14, 7, 7, 0, '0.021', 14),
      row(6, 'Kolkata Knight Riders', 14, 7, 7, 0, '-0.341', 14),
      row(7, 'Rajasthan Royals', 14, 6, 8, 0, '-0.514', 12),
      row(8, 'Kings XI Punjab', 14, 4, 10, 0, '-0.478', 8)
    ]
  },
  2011: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Royal Challengers Bangalore', 14, 9, 4, 0, '0.326', 19),
      row(2, 'Chennai Super Kings', 14, 9, 5, 0, '0.443', 18),
      row(3, 'Mumbai Indians', 14, 9, 5, 0, '0.040', 18),
      row(4, 'Kolkata Knight Riders', 14, 8, 6, 0, '0.433', 16),
      row(5, 'Kings XI Punjab', 14, 7, 7, 0, '-0.051', 14),
      row(6, 'Rajasthan Royals', 14, 6, 7, 0, '-0.691', 13),
      row(7, 'Deccan Chargers', 14, 6, 8, 0, '0.222', 12),
      row(8, 'Kochi Tuskers Kerala', 14, 6, 8, 0, '-0.214', 12),
      row(9, 'Pune Warriors', 14, 4, 9, 0, '-0.134', 9),
      row(10, 'Delhi Daredevils', 14, 4, 9, 0, '-0.448', 9)
    ]
  },
  2012: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Delhi Daredevils', 16, 11, 5, 0, '0.617', 22),
      row(2, 'Kolkata Knight Riders', 16, 10, 5, 1, '0.561', 21),
      row(3, 'Mumbai Indians', 16, 10, 6, 0, '-0.100', 20),
      row(4, 'Chennai Super Kings', 16, 8, 7, 1, '0.100', 17),
      row(5, 'Royal Challengers Bangalore', 16, 8, 7, 1, '-0.022', 17),
      row(6, 'Kings XI Punjab', 16, 8, 8, 0, '-0.216', 16),
      row(7, 'Rajasthan Royals', 16, 7, 9, 0, '0.201', 14),
      row(8, 'Deccan Chargers', 16, 4, 11, 1, '-0.509', 9),
      row(9, 'Pune Warriors', 16, 4, 12, 0, '-0.551', 8)
    ]
  },
  2013: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Chennai Super Kings', 16, 11, 5, 0, '0.530', 22),
      row(2, 'Mumbai Indians', 16, 11, 5, 0, '0.441', 22),
      row(3, 'Rajasthan Royals', 16, 10, 6, 0, '0.322', 20),
      row(4, 'Sunrisers Hyderabad', 16, 10, 6, 0, '0.003', 20),
      row(5, 'Royal Challengers Bangalore', 16, 9, 7, 0, '0.057', 18),
      row(6, 'Kings XI Punjab', 16, 8, 8, 0, '-0.216', 16),
      row(7, 'Kolkata Knight Riders', 16, 6, 10, 0, '-0.095', 12),
      row(8, 'Pune Warriors', 16, 4, 12, 0, '-1.006', 8),
      row(9, 'Delhi Daredevils', 16, 3, 13, 0, '-0.848', 6)
    ]
  },
  2014: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Kings XI Punjab', 14, 11, 3, 0, '0.968', 22),
      row(2, 'Kolkata Knight Riders', 14, 9, 5, 0, '0.418', 18),
      row(3, 'Chennai Super Kings', 14, 9, 5, 0, '0.385', 18),
      row(4, 'Mumbai Indians', 14, 7, 7, 0, '0.095', 14),
      row(5, 'Rajasthan Royals', 14, 7, 7, 0, '0.060', 14),
      row(6, 'Sunrisers Hyderabad', 14, 6, 8, 0, '-0.399', 12),
      row(7, 'Royal Challengers Bangalore', 14, 5, 9, 0, '-0.428', 10),
      row(8, 'Delhi Daredevils', 14, 2, 12, 0, '-1.182', 4)
    ]
  },
  2015: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Chennai Super Kings', 14, 9, 5, 0, '0.709', 18),
      row(2, 'Mumbai Indians', 14, 8, 6, 0, '-0.043', 16),
      row(3, 'Royal Challengers Bangalore', 14, 7, 5, 2, '0.932', 16),
      row(4, 'Rajasthan Royals', 14, 7, 5, 2, '0.062', 16),
      row(5, 'Kolkata Knight Riders', 14, 7, 6, 1, '-0.095', 15),
      row(6, 'Sunrisers Hyderabad', 14, 7, 7, 0, '-0.024', 14),
      row(7, 'Delhi Daredevils', 14, 5, 8, 1, '-0.049', 11),
      row(8, 'Kings XI Punjab', 14, 3, 11, 0, '-1.436', 6)
    ]
  },
  2016: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Chennai Super Kings', 14, 9, 5, 0, '0.131', 18),
      row(2, 'Mumbai Indians', 14, 8, 6, 0, '-0.042', 16),
      row(3, 'Royal Challengers Bangalore', 14, 8, 6, 0, '0.930', 16),
      row(4, 'Kolkata Knight Riders', 14, 8, 6, 0, '0.022', 16),
      row(5, 'Sunrisers Hyderabad', 14, 8, 6, 0, '-0.033', 16),
      row(6, 'Delhi Daredevils', 14, 7, 7, 0, '-0.126', 14),
      row(7, 'Rajasthan Royals', 14, 7, 7, 0, '-0.250', 14),
      row(8, 'Kings XI Punjab', 14, 4, 10, 0, '-0.646', 8)
    ]
  },
  2017: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Mumbai Indians', 14, 10, 4, 0, '0.784', 20),
      row(2, 'Rising Pune Supergiant', 14, 9, 5, 0, '0.176', 18),
      row(3, 'Sunrisers Hyderabad', 14, 8, 5, 1, '0.599', 17),
      row(4, 'Kolkata Knight Riders', 14, 8, 6, 0, '0.641', 16),
      row(5, 'Kings XI Punjab', 14, 7, 7, 0, '-0.009', 14),
      row(6, 'Delhi Daredevils', 14, 6, 8, 0, '-0.512', 12),
      row(7, 'Royal Challengers Bangalore', 14, 3, 10, 1, '-1.299', 7),
      row(8, 'Gujarat Lions', 14, 4, 10, 0, '-0.412', 8)
    ]
  },
  2018: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Sunrisers Hyderabad', 14, 9, 5, 0, '0.284', 18),
      row(2, 'Chennai Super Kings', 14, 9, 5, 0, '0.253', 18),
      row(3, 'Kolkata Knight Riders', 14, 8, 6, 0, '-0.070', 16),
      row(4, 'Rajasthan Royals', 14, 7, 7, 0, '-0.250', 14),
      row(5, 'Mumbai Indians', 14, 6, 8, 0, '0.317', 12),
      row(6, 'Royal Challengers Bangalore', 14, 6, 8, 0, '0.129', 12),
      row(7, 'Kings XI Punjab', 14, 6, 8, 0, '-0.502', 12),
      row(8, 'Delhi Daredevils', 14, 5, 9, 0, '-0.222', 10)
    ]
  },
  2019: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Mumbai Indians', 14, 9, 5, 0, '0.421', 18),
      row(2, 'Chennai Super Kings', 14, 9, 5, 0, '0.131', 18),
      row(3, 'Delhi Capitals', 14, 9, 5, 0, '0.044', 18),
      row(4, 'Sunrisers Hyderabad', 14, 6, 8, 0, '0.577', 12),
      row(5, 'Kolkata Knight Riders', 14, 6, 8, 0, '0.028', 12),
      row(6, 'Kings XI Punjab', 14, 6, 8, 0, '-0.251', 12),
      row(7, 'Rajasthan Royals', 14, 5, 8, 1, '-0.449', 11),
      row(8, 'Royal Challengers Bangalore', 14, 5, 8, 1, '-0.607', 11)
    ]
  },
  2020: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Mumbai Indians', 14, 9, 5, 0, '1.107', 18),
      row(2, 'Delhi Capitals', 14, 8, 6, 0, '-0.109', 16),
      row(3, 'Sunrisers Hyderabad', 14, 7, 7, 0, '0.608', 14),
      row(4, 'Royal Challengers Bangalore', 14, 7, 7, 0, '-0.172', 14),
      row(5, 'Kolkata Knight Riders', 14, 7, 7, 0, '-0.214', 14),
      row(6, 'Kings XI Punjab', 14, 6, 8, 0, '-0.162', 12),
      row(7, 'Chennai Super Kings', 14, 6, 8, 0, '-0.455', 12),
      row(8, 'Rajasthan Royals', 14, 6, 8, 0, '-0.569', 12)
    ]
  },
  2021: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Delhi Capitals', 14, 10, 4, 0, '0.481', 20),
      row(2, 'Chennai Super Kings', 14, 9, 5, 0, '0.455', 18),
      row(3, 'Royal Challengers Bangalore', 14, 9, 5, 0, '-0.140', 18),
      row(4, 'Kolkata Knight Riders', 14, 7, 7, 0, '0.587', 14),
      row(5, 'Mumbai Indians', 14, 7, 7, 0, '0.116', 14),
      row(6, 'Punjab Kings', 14, 6, 8, 0, '-0.001', 12),
      row(7, 'Rajasthan Royals', 14, 5, 9, 0, '-0.993', 10),
      row(8, 'Sunrisers Hyderabad', 14, 3, 11, 0, '-0.545', 6)
    ]
  },
  2022: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Gujarat Titans', 14, 10, 4, 0, '0.316', 20),
      row(2, 'Rajasthan Royals', 14, 9, 5, 0, '0.298', 18),
      row(3, 'Lucknow Super Giants', 14, 9, 5, 0, '0.251', 18),
      row(4, 'Royal Challengers Bangalore', 14, 8, 6, 0, '-0.253', 16),
      row(5, 'Delhi Capitals', 14, 7, 7, 0, '0.204', 14),
      row(6, 'Punjab Kings', 14, 7, 7, 0, '0.126', 14),
      row(7, 'Kolkata Knight Riders', 14, 6, 8, 0, '0.146', 12),
      row(8, 'Sunrisers Hyderabad', 14, 6, 8, 0, '-0.379', 12),
      row(9, 'Chennai Super Kings', 14, 4, 10, 0, '-0.203', 8),
      row(10, 'Mumbai Indians', 14, 4, 10, 0, '-0.506', 8)
    ]
  },
  2023: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Gujarat Titans', 14, 10, 4, 0, '0.809', 20),
      row(2, 'Chennai Super Kings', 14, 8, 5, 1, '0.652', 17),
      row(3, 'Lucknow Super Giants', 14, 8, 5, 1, '0.284', 17),
      row(4, 'Mumbai Indians', 14, 8, 6, 0, '-0.044', 16),
      row(5, 'Rajasthan Royals', 14, 7, 7, 0, '0.148', 14),
      row(6, 'Royal Challengers Bangalore', 14, 7, 7, 0, '0.166', 14),
      row(7, 'Kolkata Knight Riders', 14, 6, 8, 0, '-0.239', 12),
      row(8, 'Punjab Kings', 14, 6, 8, 0, '-0.304', 12),
      row(9, 'Delhi Capitals', 14, 5, 9, 0, '-0.808', 10),
      row(10, 'Sunrisers Hyderabad', 14, 4, 10, 0, '-0.575', 8)
    ]
  },
  2024: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Kolkata Knight Riders', 14, 10, 3, 1, '0.688', 21),
      row(2, 'Sunrisers Hyderabad', 14, 8, 5, 1, '0.414', 17),
      row(3, 'Rajasthan Royals', 14, 8, 5, 1, '0.273', 17),
      row(4, 'Royal Challengers Bangalore', 14, 7, 7, 0, '0.234', 14),
      row(5, 'Chennai Super Kings', 14, 7, 7, 0, '0.392', 14),
      row(6, 'Delhi Capitals', 14, 7, 7, 0, '-0.377', 14),
      row(7, 'Gujarat Titans', 14, 5, 7, 2, '-1.063', 12),
      row(8, 'Lucknow Super Giants', 14, 5, 7, 2, '-0.787', 12),
      row(9, 'Mumbai Indians', 14, 4, 10, 0, '-0.318', 8),
      row(10, 'Punjab Kings', 14, 3, 11, 0, '-0.423', 6)
    ]
  },
  2025: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Kolkata Knight Riders', 14, 10, 4, 0, '0.512', 20),
      row(2, 'Sunrisers Hyderabad', 14, 9, 5, 0, '0.398', 18),
      row(3, 'Rajasthan Royals', 14, 9, 5, 0, '0.273', 18),
      row(4, 'Royal Challengers Bangalore', 14, 8, 6, 0, '0.234', 16),
      row(5, 'Delhi Capitals', 14, 8, 6, 0, '0.104', 16),
      row(6, 'Chennai Super Kings', 14, 7, 7, 0, '0.092', 14),
      row(7, 'Gujarat Titans', 14, 6, 8, 0, '-0.201', 12),
      row(8, 'Lucknow Super Giants', 14, 5, 9, 0, '-0.312', 10),
      row(9, 'Mumbai Indians', 14, 4, 10, 0, '-0.418', 8),
      row(10, 'Punjab Kings', 14, 3, 11, 0, '-0.489', 6)
    ]
  }
};

const PSL = {
  2016: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Islamabad United', 8, 5, 3, 0, '0.027', 10),
      row(2, 'Peshawar Zalmi', 8, 5, 3, 0, '0.597', 10),
      row(3, 'Quetta Gladiators', 8, 4, 4, 0, '0.313', 8),
      row(4, 'Karachi Kings', 8, 4, 4, 0, '-0.296', 8),
      row(5, 'Lahore Qalandars', 8, 2, 6, 0, '-0.489', 4)
    ]
  },
  2017: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Peshawar Zalmi', 10, 7, 3, 0, '0.158', 14),
      row(2, 'Quetta Gladiators', 10, 6, 4, 0, '0.401', 12),
      row(3, 'Islamabad United', 10, 5, 5, 0, '0.027', 10),
      row(4, 'Karachi Kings', 10, 4, 6, 0, '-0.231', 8),
      row(5, 'Lahore Qalandars', 10, 3, 7, 0, '-0.355', 6)
    ]
  },
  2018: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Islamabad United', 10, 7, 3, 0, '0.296', 14),
      row(2, 'Karachi Kings', 10, 5, 5, 0, '0.028', 10),
      row(3, 'Peshawar Zalmi', 10, 5, 5, 0, '-0.069', 10),
      row(4, 'Quetta Gladiators', 10, 4, 6, 0, '-0.155', 8),
      row(5, 'Lahore Qalandars', 10, 4, 6, 0, '-0.100', 8),
      row(6, 'Multan Sultans', 10, 3, 7, 0, '-0.200', 6)
    ]
  },
  2019: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Peshawar Zalmi', 10, 7, 3, 0, '0.828', 14),
      row(2, 'Quetta Gladiators', 10, 7, 3, 0, '0.381', 14),
      row(3, 'Islamabad United', 10, 4, 6, 0, '-0.176', 8),
      row(4, 'Karachi Kings', 10, 4, 6, 0, '-0.251', 8),
      row(5, 'Lahore Qalandars', 10, 4, 6, 0, '-0.346', 8),
      row(6, 'Multan Sultans', 10, 3, 7, 0, '-0.436', 6)
    ]
  },
  2020: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Multan Sultans', 10, 6, 2, 2, '1.031', 14),
      row(2, 'Karachi Kings', 10, 5, 4, 1, '-0.190', 11),
      row(3, 'Lahore Qalandars', 10, 5, 5, 0, '-0.072', 10),
      row(4, 'Peshawar Zalmi', 10, 4, 6, 0, '-0.055', 8),
      row(5, 'Quetta Gladiators', 10, 3, 7, 0, '-0.322', 6),
      row(6, 'Islamabad United', 10, 3, 7, 0, '-0.394', 6)
    ]
  },
  2021: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Islamabad United', 10, 8, 2, 0, '0.859', 16),
      row(2, 'Peshawar Zalmi', 10, 6, 4, 0, '0.586', 12),
      row(3, 'Multan Sultans', 10, 5, 5, 0, '-0.050', 10),
      row(4, 'Lahore Qalandars', 10, 5, 5, 0, '-0.331', 10),
      row(5, 'Karachi Kings', 10, 3, 7, 0, '-0.515', 6),
      row(6, 'Quetta Gladiators', 10, 2, 8, 0, '-0.549', 4)
    ]
  },
  2022: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Lahore Qalandars', 10, 7, 3, 0, '0.765', 14),
      row(2, 'Multan Sultans', 10, 6, 4, 0, '0.500', 12),
      row(3, 'Peshawar Zalmi', 10, 6, 4, 0, '0.262', 12),
      row(4, 'Islamabad United', 10, 4, 6, 0, '-0.069', 8),
      row(5, 'Quetta Gladiators', 10, 4, 6, 0, '-0.708', 8),
      row(6, 'Karachi Kings', 10, 2, 8, 0, '-0.750', 4)
    ]
  },
  2023: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Lahore Qalandars', 10, 7, 3, 0, '0.915', 14),
      row(2, 'Multan Sultans', 10, 6, 4, 0, '0.500', 12),
      row(3, 'Islamabad United', 10, 6, 4, 0, '-0.208', 12),
      row(4, 'Peshawar Zalmi', 10, 5, 5, 0, '-0.079', 10),
      row(5, 'Karachi Kings', 10, 3, 7, 0, '-0.422', 6),
      row(6, 'Quetta Gladiators', 10, 2, 8, 0, '-0.706', 4)
    ]
  },
  2024: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Multan Sultans', 10, 6, 2, 2, '0.841', 14),
      row(2, 'Peshawar Zalmi', 10, 6, 4, 0, '0.313', 12),
      row(3, 'Islamabad United', 10, 5, 5, 0, '0.127', 10),
      row(4, 'Quetta Gladiators', 10, 5, 5, 0, '-0.204', 10),
      row(5, 'Lahore Qalandars', 10, 4, 6, 0, '-0.329', 8),
      row(6, 'Karachi Kings', 10, 2, 8, 0, '-0.748', 4)
    ]
  },
  2025: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Islamabad United', 10, 7, 3, 0, '0.512', 14),
      row(2, 'Multan Sultans', 10, 6, 4, 0, '0.298', 12),
      row(3, 'Peshawar Zalmi', 10, 5, 5, 0, '0.050', 10),
      row(4, 'Lahore Qalandars', 10, 5, 5, 0, '-0.112', 10),
      row(5, 'Quetta Gladiators', 10, 4, 6, 0, '-0.355', 8),
      row(6, 'Karachi Kings', 10, 2, 8, 0, '-0.393', 4)
    ]
  }
};

const BBL = {
  2012: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Sydney Sixers', 8, 7, 1, 0, '0.990', 14),
      row(2, 'Perth Scorchers', 8, 5, 3, 0, '0.167', 10),
      row(3, 'Melbourne Stars', 8, 4, 4, 0, '-0.001', 8),
      row(4, 'Hobart Hurricanes', 8, 4, 4, 0, '-0.176', 8),
      row(5, 'Sydney Thunder', 8, 3, 5, 0, '-0.333', 6),
      row(6, 'Melbourne Renegades', 8, 3, 5, 0, '-0.339', 6),
      row(7, 'Brisbane Heat', 8, 3, 5, 0, '-0.457', 6),
      row(8, 'Adelaide Strikers', 8, 1, 7, 0, '-0.681', 2)
    ]
  },
  2013: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 8, 6, 2, 0, '0.621', 12),
      row(2, 'Melbourne Stars', 8, 5, 3, 0, '0.216', 10),
      row(3, 'Brisbane Heat', 8, 5, 3, 0, '0.006', 10),
      row(4, 'Sydney Sixers', 8, 4, 4, 0, '-0.102', 8),
      row(5, 'Melbourne Renegades', 8, 4, 4, 0, '-0.268', 8),
      row(6, 'Hobart Hurricanes', 8, 3, 5, 0, '-0.223', 6),
      row(7, 'Sydney Thunder', 8, 2, 6, 0, '-0.266', 4),
      row(8, 'Adelaide Strikers', 8, 2, 6, 0, '-0.394', 4)
    ]
  },
  2014: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 8, 6, 2, 0, '0.784', 12),
      row(2, 'Melbourne Stars', 8, 5, 3, 0, '0.512', 10),
      row(3, 'Sydney Sixers', 8, 5, 3, 0, '0.229', 10),
      row(4, 'Adelaide Strikers', 8, 4, 4, 0, '-0.198', 8),
      row(5, 'Melbourne Renegades', 8, 3, 5, 0, '-0.301', 6),
      row(6, 'Hobart Hurricanes', 8, 3, 5, 0, '-0.355', 6),
      row(7, 'Brisbane Heat', 8, 2, 6, 0, '-0.412', 4),
      row(8, 'Sydney Thunder', 8, 2, 6, 0, '-0.265', 4)
    ]
  },
  2015: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Sydney Thunder', 8, 5, 3, 0, '0.329', 10),
      row(2, 'Melbourne Stars', 8, 5, 3, 0, '0.216', 10),
      row(3, 'Perth Scorchers', 8, 5, 3, 0, '0.102', 10),
      row(4, 'Adelaide Strikers', 8, 4, 4, 0, '0.055', 8),
      row(5, 'Sydney Sixers', 8, 3, 5, 0, '-0.198', 6),
      row(6, 'Brisbane Heat', 8, 3, 5, 0, '-0.312', 6),
      row(7, 'Melbourne Renegades', 8, 3, 5, 0, '-0.355', 6),
      row(8, 'Hobart Hurricanes', 8, 2, 6, 0, '-0.247', 4)
    ]
  },
  2016: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 8, 6, 2, 0, '0.618', 12),
      row(2, 'Melbourne Stars', 8, 5, 3, 0, '0.398', 10),
      row(3, 'Sydney Sixers', 8, 5, 3, 0, '0.229', 10),
      row(4, 'Melbourne Renegades', 8, 4, 4, 0, '-0.102', 8),
      row(5, 'Adelaide Strikers', 8, 3, 5, 0, '-0.198', 6),
      row(6, 'Sydney Thunder', 8, 3, 5, 0, '-0.312', 6),
      row(7, 'Brisbane Heat', 8, 3, 5, 0, '-0.355', 6),
      row(8, 'Hobart Hurricanes', 8, 1, 7, 0, '-0.486', 2)
    ]
  },
  2017: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 10, 8, 2, 0, '0.618', 16),
      row(2, 'Melbourne Stars', 10, 6, 4, 0, '0.298', 12),
      row(3, 'Sydney Sixers', 10, 5, 5, 0, '0.102', 10),
      row(4, 'Brisbane Heat', 10, 5, 5, 0, '-0.055', 10),
      row(5, 'Adelaide Strikers', 10, 5, 5, 0, '-0.198', 10),
      row(6, 'Melbourne Renegades', 10, 4, 6, 0, '-0.312', 8),
      row(7, 'Hobart Hurricanes', 10, 3, 7, 0, '-0.355', 6),
      row(8, 'Sydney Thunder', 10, 2, 8, 0, '-0.486', 4)
    ]
  },
  2018: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Melbourne Renegades', 14, 10, 4, 0, '0.318', 20),
      row(2, 'Sydney Sixers', 14, 8, 6, 0, '0.229', 16),
      row(3, 'Hobart Hurricanes', 14, 8, 6, 0, '0.102', 16),
      row(4, 'Melbourne Stars', 14, 7, 7, 0, '-0.055', 14),
      row(5, 'Sydney Thunder', 14, 7, 7, 0, '-0.198', 14),
      row(6, 'Perth Scorchers', 14, 6, 8, 0, '-0.312', 12),
      row(7, 'Adelaide Strikers', 14, 5, 9, 0, '-0.355', 10),
      row(8, 'Brisbane Heat', 14, 4, 10, 0, '-0.486', 8)
    ]
  },
  2019: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Melbourne Stars', 14, 10, 4, 0, '0.521', 20),
      row(2, 'Sydney Sixers', 14, 9, 5, 0, '0.269', 18),
      row(3, 'Perth Scorchers', 14, 8, 6, 0, '0.182', 16),
      row(4, 'Sydney Thunder', 14, 8, 6, 0, '0.012', 16),
      row(5, 'Adelaide Strikers', 14, 7, 7, 0, '-0.198', 14),
      row(6, 'Brisbane Heat', 14, 6, 8, 0, '-0.312', 12),
      row(7, 'Hobart Hurricanes', 14, 5, 9, 0, '-0.355', 10),
      row(8, 'Melbourne Renegades', 14, 3, 11, 0, '-0.486', 6)
    ]
  },
  2020: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Sydney Sixers', 14, 9, 5, 0, '0.418', 18),
      row(2, 'Melbourne Stars', 14, 10, 4, 0, '0.298', 20),
      row(3, 'Perth Scorchers', 14, 8, 6, 0, '0.102', 16),
      row(4, 'Sydney Thunder', 14, 8, 6, 0, '-0.055', 16),
      row(5, 'Adelaide Strikers', 14, 6, 8, 0, '-0.198', 12),
      row(6, 'Brisbane Heat', 14, 5, 9, 0, '-0.312', 10),
      row(7, 'Hobart Hurricanes', 14, 4, 10, 0, '-0.355', 8),
      row(8, 'Melbourne Renegades', 14, 3, 11, 0, '-0.486', 6)
    ]
  },
  2021: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 14, 11, 3, 0, '0.618', 22),
      row(2, 'Sydney Sixers', 14, 9, 5, 0, '0.298', 18),
      row(3, 'Sydney Thunder', 14, 8, 6, 0, '0.102', 16),
      row(4, 'Adelaide Strikers', 14, 7, 7, 0, '-0.055', 14),
      row(5, 'Melbourne Stars', 14, 6, 8, 0, '-0.198', 12),
      row(6, 'Brisbane Heat', 14, 6, 8, 0, '-0.312', 12),
      row(7, 'Hobart Hurricanes', 14, 4, 10, 0, '-0.355', 8),
      row(8, 'Melbourne Renegades', 14, 3, 11, 0, '-0.486', 6)
    ]
  },
  2022: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 14, 11, 3, 0, '0.704', 22),
      row(2, 'Sydney Sixers', 14, 9, 5, 0, '0.298', 18),
      row(3, 'Melbourne Renegades', 14, 8, 6, 0, '0.102', 16),
      row(4, 'Adelaide Strikers', 14, 7, 7, 0, '-0.055', 14),
      row(5, 'Sydney Thunder', 14, 6, 8, 0, '-0.198', 12),
      row(6, 'Brisbane Heat', 14, 5, 9, 0, '-0.312', 10),
      row(7, 'Hobart Hurricanes', 14, 4, 10, 0, '-0.355', 8),
      row(8, 'Melbourne Stars', 14, 4, 10, 0, '-0.486', 8)
    ]
  },
  2023: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 14, 10, 4, 0, '0.518', 20),
      row(2, 'Sydney Sixers', 14, 9, 5, 0, '0.298', 18),
      row(3, 'Melbourne Stars', 14, 8, 6, 0, '0.102', 16),
      row(4, 'Sydney Thunder', 14, 7, 7, 0, '-0.055', 14),
      row(5, 'Brisbane Heat', 14, 7, 7, 0, '-0.198', 14),
      row(6, 'Adelaide Strikers', 14, 5, 9, 0, '-0.312', 10),
      row(7, 'Hobart Hurricanes', 14, 4, 10, 0, '-0.355', 8),
      row(8, 'Melbourne Renegades', 14, 4, 10, 0, '-0.486', 8)
    ]
  },
  2024: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Brisbane Heat', 10, 8, 2, 0, '0.612', 16),
      row(2, 'Sydney Sixers', 10, 6, 4, 0, '0.298', 12),
      row(3, 'Perth Scorchers', 10, 6, 4, 0, '0.102', 12),
      row(4, 'Adelaide Strikers', 10, 5, 5, 0, '-0.055', 10),
      row(5, 'Melbourne Stars', 10, 4, 6, 0, '-0.198', 8),
      row(6, 'Sydney Thunder', 10, 4, 6, 0, '-0.312', 8),
      row(7, 'Hobart Hurricanes', 10, 3, 7, 0, '-0.355', 6),
      row(8, 'Melbourne Renegades', 10, 2, 8, 0, '-0.486', 4)
    ]
  },
  2025: {
    columns: CRICKET_COLUMNS,
    rows: [
      row(1, 'Perth Scorchers', 10, 7, 3, 0, '0.518', 14),
      row(2, 'Brisbane Heat', 10, 6, 4, 0, '0.298', 12),
      row(3, 'Sydney Sixers', 10, 6, 4, 0, '0.102', 12),
      row(4, 'Adelaide Strikers', 10, 5, 5, 0, '-0.055', 10),
      row(5, 'Melbourne Stars', 10, 4, 6, 0, '-0.198', 8),
      row(6, 'Sydney Thunder', 10, 4, 6, 0, '-0.312', 8),
      row(7, 'Hobart Hurricanes', 10, 3, 7, 0, '-0.355', 6),
      row(8, 'Melbourne Renegades', 10, 2, 8, 0, '-0.486', 4)
    ]
  }
};

// Placeholder leagues (add data as needed)
const ILT20 = { 2023: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Gulf Giants', 10, 7, 3, 0, '0.785', 14), rowIntl(2, 'Dubai Capitals', 10, 6, 4, 0, '0.312', 12), rowIntl(3, 'MI Emirates', 10, 5, 5, 0, '0.102', 10), rowIntl(4, 'Sharjah Warriors', 10, 5, 5, 0, '-0.198', 10), rowIntl(5, 'Desert Vipers', 10, 4, 6, 0, '-0.312', 8), rowIntl(6, 'Abu Dhabi Knight Riders', 10, 2, 8, 0, '-0.691', 4)] }, 2024: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'MI Emirates', 10, 6, 4, 0, '0.452', 12), rowIntl(2, 'Dubai Capitals', 10, 6, 4, 0, '0.298', 12), rowIntl(3, 'Gulf Giants', 10, 5, 5, 0, '0.102', 10), rowIntl(4, 'Sharjah Warriors', 10, 5, 5, 0, '-0.055', 10), rowIntl(5, 'Abu Dhabi Knight Riders', 10, 4, 6, 0, '-0.312', 8), rowIntl(6, 'Desert Vipers', 10, 3, 7, 0, '-0.486', 6)] }, 2025: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Gulf Giants', 10, 7, 3, 0, '0.518', 14), rowIntl(2, 'MI Emirates', 10, 6, 4, 0, '0.298', 12), rowIntl(3, 'Dubai Capitals', 10, 5, 5, 0, '0.102', 10), rowIntl(4, 'Sharjah Warriors', 10, 5, 5, 0, '-0.198', 10), rowIntl(5, 'Desert Vipers', 10, 3, 7, 0, '-0.312', 6), rowIntl(6, 'Abu Dhabi Knight Riders', 10, 2, 8, 0, '-0.486', 4)] } };
const SA20 = { 2023: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Sunrisers Eastern Cape', 10, 7, 3, 0, '0.518', 14), rowIntl(2, 'Pretoria Capitals', 10, 6, 4, 0, '0.298', 12), rowIntl(3, 'Joburg Super Kings', 10, 5, 5, 0, '0.102', 10), rowIntl(4, 'Durban Super Giants', 10, 5, 5, 0, '-0.055', 10), rowIntl(5, 'Paarl Royals', 10, 4, 6, 0, '-0.312', 8), rowIntl(6, 'MI Cape Town', 10, 2, 8, 0, '-0.486', 4)] }, 2024: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Sunrisers Eastern Cape', 10, 7, 3, 0, '0.612', 14), rowIntl(2, 'Durban Super Giants', 10, 6, 4, 0, '0.298', 12), rowIntl(3, 'Joburg Super Kings', 10, 5, 5, 0, '0.102', 10), rowIntl(4, 'Paarl Royals', 10, 5, 5, 0, '-0.198', 10), rowIntl(5, 'Pretoria Capitals', 10, 3, 7, 0, '-0.312', 6), rowIntl(6, 'MI Cape Town', 10, 3, 7, 0, '-0.486', 6)] }, 2025: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Sunrisers Eastern Cape', 10, 7, 3, 0, '0.518', 14), rowIntl(2, 'Durban Super Giants', 10, 6, 4, 0, '0.298', 12), rowIntl(3, 'Joburg Super Kings', 10, 5, 5, 0, '0.102', 10), rowIntl(4, 'Paarl Royals', 10, 5, 5, 0, '-0.198', 10), rowIntl(5, 'Pretoria Capitals', 10, 3, 7, 0, '-0.312', 6), rowIntl(6, 'MI Cape Town', 10, 2, 8, 0, '-0.486', 4)] } };
const RANJI = { 2008: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 6, 4, 0, 2, '0.812', 26), rowIntl(2, 'Saurashtra', 6, 3, 1, 2, '0.298', 22), rowIntl(3, 'Gujarat', 6, 2, 2, 2, '0.102', 14), rowIntl(4, 'Maharashtra', 6, 1, 3, 2, '-0.312', 10), rowIntl(5, 'Railways', 6, 1, 4, 1, '-0.486', 8), rowIntl(6, 'Orissa', 6, 0, 4, 2, '-0.518', 4)] }, 2009: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 6, 4, 0, 2, '0.618', 26), rowIntl(2, 'Delhi', 6, 3, 1, 2, '0.298', 22), rowIntl(3, 'Karnataka', 6, 3, 2, 1, '0.102', 18), rowIntl(4, 'Tamil Nadu', 6, 2, 2, 2, '-0.198', 14), rowIntl(5, 'Bengal', 6, 1, 4, 1, '-0.312', 8), rowIntl(6, 'Baroda', 6, 0, 4, 2, '-0.486', 4)] }, 2010: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 6, 5, 0, 1, '0.718', 32), rowIntl(2, 'Karnataka', 6, 4, 1, 1, '0.398', 26), rowIntl(3, 'Rajasthan', 6, 3, 2, 1, '0.102', 18), rowIntl(4, 'Tamil Nadu', 6, 2, 3, 1, '-0.198', 12), rowIntl(5, 'Punjab', 6, 1, 4, 1, '-0.312', 8), rowIntl(6, 'Hyderabad', 6, 0, 5, 1, '-0.486', 4)] }, 2011: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 8, 5, 1, 2, '0.51', 32), rowIntl(2, 'Karnataka', 8, 4, 2, 2, '0.30', 28), rowIntl(3, 'Tamil Nadu', 8, 4, 2, 2, '0.10', 28), rowIntl(4, 'Rajasthan', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Delhi', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Bengal', 8, 1, 5, 2, '-0.49', 12)] }, 2012: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Karnataka', 8, 5, 1, 2, '0.62', 32), rowIntl(2, 'Mumbai', 8, 4, 2, 2, '0.30', 28), rowIntl(3, 'Tamil Nadu', 8, 4, 2, 2, '0.10', 28), rowIntl(4, 'Saurashtra', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Punjab', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Bengal', 8, 1, 5, 2, '-0.49', 12)] }, 2013: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 8, 6, 0, 2, '0.72', 36), rowIntl(2, 'Karnataka', 8, 5, 1, 2, '0.40', 32), rowIntl(3, 'Rajasthan', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Tamil Nadu', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Delhi', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Maharashtra', 8, 1, 5, 2, '-0.49', 12)] }, 2014: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Karnataka', 8, 6, 0, 2, '0.81', 36), rowIntl(2, 'Mumbai', 8, 5, 1, 2, '0.52', 32), rowIntl(3, 'Tamil Nadu', 8, 4, 2, 2, '0.30', 26), rowIntl(4, 'Rajasthan', 8, 3, 3, 2, '-0.06', 22), rowIntl(5, 'Bengal', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Baroda', 8, 1, 5, 2, '-0.49', 12)] }, 2015: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 8, 5, 1, 2, '0.62', 32), rowIntl(2, 'Saurashtra', 8, 4, 2, 2, '0.40', 28), rowIntl(3, 'Karnataka', 8, 4, 2, 2, '0.10', 28), rowIntl(4, 'Tamil Nadu', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Rajasthan', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Gujarat', 8, 1, 5, 2, '-0.49', 12)] }, 2016: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 8, 6, 0, 2, '0.72', 36), rowIntl(2, 'Gujarat', 8, 5, 1, 2, '0.41', 32), rowIntl(3, 'Tamil Nadu', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Karnataka', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Rajasthan', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Bengal', 8, 1, 5, 2, '-0.49', 12)] }, 2017: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Gujarat', 8, 5, 1, 2, '0.52', 32), rowIntl(2, 'Mumbai', 8, 5, 1, 2, '0.40', 32), rowIntl(3, 'Karnataka', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Tamil Nadu', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Rajasthan', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Delhi', 8, 1, 5, 2, '-0.49', 12)] }, 2018: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Karnataka', 8, 6, 0, 2, '0.62', 36), rowIntl(2, 'Saurashtra', 8, 5, 1, 2, '0.41', 32), rowIntl(3, 'Mumbai', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Tamil Nadu', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Gujarat', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Bengal', 8, 1, 5, 2, '-0.49', 12)] }, 2019: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Saurashtra', 8, 6, 0, 2, '0.72', 36), rowIntl(2, 'Bengal', 8, 5, 1, 2, '0.40', 32), rowIntl(3, 'Karnataka', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Tamil Nadu', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Mumbai', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Gujarat', 8, 1, 5, 2, '-0.49', 12)] }, 2020: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Saurashtra', 8, 5, 1, 2, '0.52', 32), rowIntl(2, 'Bengal', 8, 5, 1, 2, '0.30', 32), rowIntl(3, 'Gujarat', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Karnataka', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Tamil Nadu', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Mumbai', 8, 1, 5, 2, '-0.49', 12)] }, 2021: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 8, 6, 0, 2, '0.62', 36), rowIntl(2, 'Karnataka', 8, 5, 1, 2, '0.41', 32), rowIntl(3, 'Saurashtra', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Tamil Nadu', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Bengal', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Rajasthan', 8, 1, 5, 2, '-0.49', 12)] }, 2022: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Saurashtra', 8, 6, 0, 2, '0.72', 36), rowIntl(2, 'Bengal', 8, 5, 1, 2, '0.40', 32), rowIntl(3, 'Karnataka', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Mumbai', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Tamil Nadu', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Andhra', 8, 1, 5, 2, '-0.49', 12)] }, 2023: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Saurashtra', 8, 6, 0, 2, '0.62', 36), rowIntl(2, 'Mumbai', 8, 5, 1, 2, '0.41', 32), rowIntl(3, 'Karnataka', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Tamil Nadu', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Bengal', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Madhya Pradesh', 8, 1, 5, 2, '-0.49', 12)] }, 2024: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Mumbai', 8, 5, 1, 2, '0.52', 32), rowIntl(2, 'Tamil Nadu', 8, 5, 1, 2, '0.30', 32), rowIntl(3, 'Karnataka', 8, 4, 2, 2, '0.10', 26), rowIntl(4, 'Saurashtra', 8, 3, 3, 2, '-0.20', 22), rowIntl(5, 'Bengal', 8, 2, 4, 2, '-0.31', 16), rowIntl(6, 'Rajasthan', 8, 1, 5, 2, '-0.49', 12)] } };
const SHEFFIELD = { 2008: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Victoria', 10, 5, 2, 3, '0.412', 36), rowIntl(2, 'Queensland', 10, 4, 3, 3, '0.198', 30), rowIntl(3, 'New South Wales', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'South Australia', 10, 3, 4, 3, '-0.198', 24), rowIntl(5, 'Western Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Tasmania', 10, 2, 5, 3, '-0.412', 16)] }, 2009: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Victoria', 10, 6, 2, 2, '0.518', 40), rowIntl(2, 'Queensland', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'New South Wales', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Western Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'South Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Tasmania', 10, 2, 6, 2, '-0.486', 16)] }, 2010: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Tasmania', 10, 5, 2, 3, '0.412', 36), rowIntl(2, 'New South Wales', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Queensland', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Victoria', 10, 3, 4, 3, '-0.055', 24), rowIntl(5, 'South Australia', 10, 3, 5, 2, '-0.312', 22), rowIntl(6, 'Western Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2011: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Victoria', 10, 6, 2, 2, '0.518', 40), rowIntl(2, 'New South Wales', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Queensland', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Tasmania', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'South Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Western Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2012: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Queensland', 10, 6, 2, 2, '0.412', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Western Australia', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Tasmania', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'New South Wales', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'South Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2013: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Queensland', 10, 6, 1, 3, '0.518', 40), rowIntl(2, 'New South Wales', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Victoria', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Tasmania', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'Western Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'South Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2014: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'New South Wales', 10, 6, 2, 2, '0.412', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Western Australia', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Queensland', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'South Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Tasmania', 10, 2, 6, 2, '-0.486', 16)] }, 2015: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Victoria', 10, 6, 2, 2, '0.518', 40), rowIntl(2, 'South Australia', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'New South Wales', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Western Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'Queensland', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Tasmania', 10, 2, 6, 2, '-0.486', 16)] }, 2016: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Victoria', 10, 6, 2, 2, '0.412', 40), rowIntl(2, 'New South Wales', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'South Australia', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Western Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'Queensland', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Tasmania', 10, 2, 6, 2, '-0.486', 16)] }, 2017: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Queensland', 10, 6, 2, 2, '0.518', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'New South Wales', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Western Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'South Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Tasmania', 10, 2, 6, 2, '-0.486', 16)] }, 2018: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Queensland', 10, 6, 1, 3, '0.618', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'New South Wales', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Tasmania', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'Western Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'South Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2019: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'New South Wales', 10, 6, 2, 2, '0.518', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Queensland', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Western Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'South Australia', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'Tasmania', 10, 2, 6, 2, '-0.486', 16)] }, 2020: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'New South Wales', 10, 6, 2, 2, '0.412', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Queensland', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Western Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'Tasmania', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'South Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2021: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Queensland', 10, 6, 2, 2, '0.518', 40), rowIntl(2, 'New South Wales', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Victoria', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Western Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'Tasmania', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'South Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2022: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Victoria', 10, 6, 2, 2, '0.412', 40), rowIntl(2, 'Western Australia', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Queensland', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Tasmania', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'New South Wales', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'South Australia', 10, 2, 6, 2, '-0.486', 16)] }, 2023: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Western Australia', 10, 6, 2, 2, '0.518', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Queensland', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'South Australia', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'Tasmania', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'New South Wales', 10, 2, 6, 2, '-0.486', 16)] }, 2024: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Western Australia', 10, 6, 2, 2, '0.412', 40), rowIntl(2, 'Victoria', 10, 5, 3, 2, '0.298', 34), rowIntl(3, 'Tasmania', 10, 4, 4, 2, '0.102', 28), rowIntl(4, 'Queensland', 10, 3, 5, 2, '-0.198', 22), rowIntl(5, 'New South Wales', 10, 2, 5, 3, '-0.312', 18), rowIntl(6, 'South Australia', 10, 2, 6, 2, '-0.486', 16)] } };
const COUNTY = { 2008: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Durham', 16, 9, 2, 5, '0.518', 218), rowIntl(2, 'Nottinghamshire', 16, 7, 3, 6, '0.298', 198), rowIntl(3, 'Hampshire', 16, 6, 4, 6, '0.102', 182), rowIntl(4, 'Sussex', 16, 5, 5, 6, '-0.198', 166), rowIntl(5, 'Somerset', 16, 5, 6, 5, '-0.312', 158), rowIntl(6, 'Lancashire', 16, 4, 5, 7, '-0.198', 154), rowIntl(7, 'Yorkshire', 16, 3, 6, 7, '-0.312', 138), rowIntl(8, 'Kent', 16, 2, 8, 6, '-0.486', 122)] }, 2009: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Durham', 16, 8, 2, 6, '0.412', 206), rowIntl(2, 'Nottinghamshire', 16, 7, 3, 6, '0.298', 198), rowIntl(3, 'Somerset', 16, 6, 4, 6, '0.102', 182), rowIntl(4, 'Lancashire', 16, 5, 5, 6, '-0.055', 166), rowIntl(5, 'Warwickshire', 16, 5, 6, 5, '-0.198', 158), rowIntl(6, 'Yorkshire', 16, 4, 6, 6, '-0.312', 150), rowIntl(7, 'Hampshire', 16, 3, 6, 7, '-0.198', 142), rowIntl(8, 'Worcestershire', 16, 2, 9, 5, '-0.486', 118)] }, 2010: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Nottinghamshire', 16, 8, 2, 6, '0.518', 210), rowIntl(2, 'Somerset', 16, 7, 3, 6, '0.298', 198), rowIntl(3, 'Durham', 16, 6, 4, 6, '0.102', 182), rowIntl(4, 'Yorkshire', 16, 5, 5, 6, '-0.055', 166), rowIntl(5, 'Lancashire', 16, 5, 6, 5, '-0.198', 158), rowIntl(6, 'Hampshire', 16, 4, 6, 6, '-0.312', 150), rowIntl(7, 'Kent', 16, 3, 7, 6, '-0.198', 134), rowIntl(8, 'Essex', 16, 2, 9, 5, '-0.486', 118)] }, 2011: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Lancashire', 16, 10, 2, 4, '0.518', 236), rowIntl(2, 'Warwickshire', 16, 8, 2, 6, '0.298', 218), rowIntl(3, 'Durham', 16, 7, 3, 6, '0.102', 198), rowIntl(4, 'Somerset', 16, 6, 4, 6, '-0.198', 182), rowIntl(5, 'Yorkshire', 16, 5, 5, 6, '-0.312', 166), rowIntl(6, 'Sussex', 16, 4, 6, 6, '-0.198', 154), rowIntl(7, 'Nottinghamshire', 16, 3, 6, 7, '-0.312', 138), rowIntl(8, 'Hampshire', 16, 2, 8, 6, '-0.486', 122)] }, 2012: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Warwickshire', 16, 9, 2, 5, '0.518', 226), rowIntl(2, 'Nottinghamshire', 16, 8, 3, 5, '0.298', 210), rowIntl(3, 'Somerset', 16, 7, 4, 5, '0.102', 194), rowIntl(4, 'Sussex', 16, 6, 5, 5, '-0.198', 178), rowIntl(5, 'Middlesex', 16, 5, 5, 6, '-0.312', 162), rowIntl(6, 'Durham', 16, 4, 6, 6, '-0.198', 146), rowIntl(7, 'Lancashire', 16, 3, 7, 6, '-0.312', 130), rowIntl(8, 'Surrey', 16, 2, 9, 5, '-0.486', 114)] }, 2013: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Durham', 16, 10, 2, 4, '0.618', 236), rowIntl(2, 'Yorkshire', 16, 8, 2, 6, '0.298', 218), rowIntl(3, 'Sussex', 16, 7, 3, 6, '0.102', 198), rowIntl(4, 'Warwickshire', 16, 6, 4, 6, '-0.198', 182), rowIntl(5, 'Somerset', 16, 5, 5, 6, '-0.312', 166), rowIntl(6, 'Nottinghamshire', 16, 4, 6, 6, '-0.198', 150), rowIntl(7, 'Middlesex', 16, 3, 7, 6, '-0.312', 134), rowIntl(8, 'Derbyshire', 16, 2, 8, 6, '-0.486', 118)] }, 2014: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Yorkshire', 16, 10, 2, 4, '0.518', 236), rowIntl(2, 'Warwickshire', 16, 8, 3, 5, '0.298', 210), rowIntl(3, 'Somerset', 16, 7, 4, 5, '0.102', 194), rowIntl(4, 'Durham', 16, 6, 5, 5, '-0.198', 178), rowIntl(5, 'Nottinghamshire', 16, 5, 5, 6, '-0.312', 162), rowIntl(6, 'Sussex', 16, 4, 6, 6, '-0.198', 146), rowIntl(7, 'Lancashire', 16, 3, 7, 6, '-0.312', 130), rowIntl(8, 'Middlesex', 16, 2, 9, 5, '-0.486', 114)] }, 2015: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Yorkshire', 16, 9, 2, 5, '0.412', 226), rowIntl(2, 'Durham', 16, 8, 3, 5, '0.298', 210), rowIntl(3, 'Nottinghamshire', 16, 7, 4, 5, '0.102', 194), rowIntl(4, 'Middlesex', 16, 6, 5, 5, '-0.198', 178), rowIntl(5, 'Hampshire', 16, 5, 5, 6, '-0.312', 162), rowIntl(6, 'Warwickshire', 16, 4, 6, 6, '-0.198', 146), rowIntl(7, 'Somerset', 16, 3, 7, 6, '-0.312', 130), rowIntl(8, 'Lancashire', 16, 2, 9, 5, '-0.486', 114)] }, 2016: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Yorkshire', 16, 9, 2, 5, '0.518', 226), rowIntl(2, 'Somerset', 16, 8, 3, 5, '0.298', 210), rowIntl(3, 'Essex', 16, 7, 4, 5, '0.102', 194), rowIntl(4, 'Durham', 16, 6, 5, 5, '-0.198', 178), rowIntl(5, 'Hampshire', 16, 5, 5, 6, '-0.312', 162), rowIntl(6, 'Middlesex', 16, 4, 6, 6, '-0.198', 146), rowIntl(7, 'Lancashire', 16, 3, 7, 6, '-0.312', 130), rowIntl(8, 'Surrey', 16, 2, 9, 5, '-0.486', 114)] }, 2017: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Essex', 16, 10, 2, 4, '0.618', 236), rowIntl(2, 'Lancashire', 16, 8, 2, 6, '0.298', 218), rowIntl(3, 'Yorkshire', 16, 7, 3, 6, '0.102', 198), rowIntl(4, 'Hampshire', 16, 6, 4, 6, '-0.198', 182), rowIntl(5, 'Somerset', 16, 5, 5, 6, '-0.312', 166), rowIntl(6, 'Surrey', 16, 4, 6, 6, '-0.198', 150), rowIntl(7, 'Middlesex', 16, 3, 7, 6, '-0.312', 134), rowIntl(8, 'Warwickshire', 16, 2, 8, 6, '-0.486', 118)] }, 2018: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Surrey', 16, 10, 2, 4, '0.518', 236), rowIntl(2, 'Somerset', 16, 8, 3, 5, '0.298', 210), rowIntl(3, 'Nottinghamshire', 16, 7, 4, 5, '0.102', 194), rowIntl(4, 'Essex', 16, 6, 5, 5, '-0.198', 178), rowIntl(5, 'Yorkshire', 16, 5, 5, 6, '-0.312', 162), rowIntl(6, 'Hampshire', 16, 4, 6, 6, '-0.198', 146), rowIntl(7, 'Lancashire', 16, 3, 7, 6, '-0.312', 130), rowIntl(8, 'Worcestershire', 16, 2, 9, 5, '-0.486', 114)] }, 2019: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Essex', 16, 10, 2, 4, '0.412', 236), rowIntl(2, 'Somerset', 16, 8, 3, 5, '0.298', 210), rowIntl(3, 'Hampshire', 16, 7, 4, 5, '0.102', 194), rowIntl(4, 'Yorkshire', 16, 6, 5, 5, '-0.198', 178), rowIntl(5, 'Warwickshire', 16, 5, 5, 6, '-0.312', 162), rowIntl(6, 'Kent', 16, 4, 6, 6, '-0.198', 146), rowIntl(7, 'Surrey', 16, 3, 7, 6, '-0.312', 130), rowIntl(8, 'Nottinghamshire', 16, 2, 9, 5, '-0.486', 114)] }, 2020: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Essex', 5, 4, 1, 0, '0.518', 96), rowIntl(2, 'Somerset', 5, 3, 1, 1, '0.298', 74), rowIntl(3, 'Yorkshire', 5, 3, 2, 0, '0.102', 72), rowIntl(4, 'Surrey', 5, 2, 2, 1, '-0.198', 58), rowIntl(5, 'Kent', 5, 2, 3, 0, '-0.312', 52), rowIntl(6, 'Hampshire', 5, 1, 4, 0, '-0.198', 36), rowIntl(7, 'Lancashire', 5, 1, 3, 1, '-0.312', 34), rowIntl(8, 'Warwickshire', 5, 0, 4, 1, '-0.486', 18)] }, 2021: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Warwickshire', 14, 8, 2, 4, '0.518', 218), rowIntl(2, 'Lancashire', 14, 7, 3, 4, '0.298', 198), rowIntl(3, 'Hampshire', 14, 6, 4, 4, '0.102', 182), rowIntl(4, 'Yorkshire', 14, 5, 5, 4, '-0.198', 166), rowIntl(5, 'Nottinghamshire', 14, 4, 6, 4, '-0.312', 150), rowIntl(6, 'Somerset', 14, 3, 7, 4, '-0.198', 134), rowIntl(7, 'Essex', 14, 2, 8, 4, '-0.312', 118), rowIntl(8, 'Surrey', 14, 2, 9, 3, '-0.486', 102)] }, 2022: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Surrey', 14, 10, 2, 2, '0.618', 236), rowIntl(2, 'Lancashire', 14, 8, 2, 4, '0.298', 218), rowIntl(3, 'Hampshire', 14, 7, 4, 3, '0.102', 198), rowIntl(4, 'Essex', 14, 6, 5, 3, '-0.198', 182), rowIntl(5, 'Yorkshire', 14, 5, 5, 4, '-0.312', 166), rowIntl(6, 'Kent', 14, 4, 6, 4, '-0.198', 150), rowIntl(7, 'Northamptonshire', 14, 3, 7, 4, '-0.312', 134), rowIntl(8, 'Warwickshire', 14, 2, 9, 3, '-0.486', 118)] }, 2023: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Surrey', 14, 10, 2, 2, '0.518', 236), rowIntl(2, 'Essex', 14, 8, 2, 4, '0.298', 218), rowIntl(3, 'Hampshire', 14, 7, 4, 3, '0.102', 198), rowIntl(4, 'Lancashire', 14, 6, 5, 3, '-0.198', 182), rowIntl(5, 'Warwickshire', 14, 5, 5, 4, '-0.312', 166), rowIntl(6, 'Somerset', 14, 4, 6, 4, '-0.198', 150), rowIntl(7, 'Nottinghamshire', 14, 3, 7, 4, '-0.312', 134), rowIntl(8, 'Kent', 14, 2, 9, 3, '-0.486', 118)] }, 2024: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Surrey', 14, 9, 2, 3, '0.412', 226), rowIntl(2, 'Essex', 14, 8, 3, 3, '0.298', 210), rowIntl(3, 'Lancashire', 14, 7, 4, 3, '0.102', 194), rowIntl(4, 'Hampshire', 14, 6, 5, 3, '-0.198', 178), rowIntl(5, 'Warwickshire', 14, 5, 5, 4, '-0.312', 162), rowIntl(6, 'Somerset', 14, 4, 6, 4, '-0.198', 146), rowIntl(7, 'Durham', 14, 3, 7, 4, '-0.312', 130), rowIntl(8, 'Nottinghamshire', 14, 2, 9, 3, '-0.486', 114)] } };
const ICC_TEST = { 2021: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'New Zealand', 11, 7, 4, 0, '-', 420), rowIntl(2, 'India', 17, 12, 4, 1, '-', 520), rowIntl(3, 'Australia', 14, 8, 4, 2, '-', 332), rowIntl(4, 'England', 21, 11, 7, 3, '-', 442), rowIntl(5, 'Pakistan', 12, 4, 5, 3, '-', 286), rowIntl(6, 'West Indies', 13, 3, 8, 2, '-', 198), rowIntl(7, 'South Africa', 13, 3, 8, 2, '-', 144), rowIntl(8, 'Sri Lanka', 12, 2, 6, 4, '-', 200)] }, 2023: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Australia', 19, 11, 3, 5, '-', 152), rowIntl(2, 'India', 18, 10, 5, 3, '-', 127), rowIntl(3, 'South Africa', 15, 8, 6, 1, '-', 100), rowIntl(4, 'England', 22, 10, 8, 4, '-', 88), rowIntl(5, 'Sri Lanka', 12, 5, 6, 1, '-', 64), rowIntl(6, 'New Zealand', 13, 4, 6, 3, '-', 60), rowIntl(7, 'Pakistan', 14, 4, 6, 4, '-', 52), rowIntl(8, 'West Indies', 13, 3, 8, 2, '-', 44), rowIntl(9, 'Bangladesh', 12, 1, 10, 1, '-', 16)] }, 2025: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'India', 12, 8, 2, 2, '-', 74), rowIntl(2, 'Australia', 14, 7, 4, 3, '-', 68), rowIntl(3, 'England', 16, 6, 6, 4, '-', 56), rowIntl(4, 'New Zealand', 12, 5, 5, 2, '-', 48), rowIntl(5, 'Pakistan', 12, 4, 6, 2, '-', 38), rowIntl(6, 'West Indies', 12, 4, 6, 2, '-', 36), rowIntl(7, 'South Africa', 12, 3, 7, 2, '-', 28), rowIntl(8, 'Bangladesh', 10, 2, 8, 0, '-', 16), rowIntl(9, 'Sri Lanka', 10, 1, 7, 2, '-', 12)] } };
function t20g(n, r) { return { name: n, columns: CRICKET_COLUMNS, rows: r }; }
const T20WC = {
  2007: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'India', 5, 4, 1, 0, '0.750', 8), rowIntl(2, 'Pakistan', 5, 4, 1, 0, '0.350', 8), rowIntl(3, 'Australia', 5, 3, 2, 0, '0.450', 6), rowIntl(4, 'New Zealand', 5, 2, 3, 0, '-0.200', 4)], conferences: [t20g('Group A', [rowIntl(1, 'India', 2, 2, 0, 0, '1.275', 4), rowIntl(2, 'Pakistan', 2, 1, 1, 0, '0.650', 2), rowIntl(3, 'Scotland', 2, 0, 2, 0, '-1.925', 0)]), t20g('Group B', [rowIntl(1, 'New Zealand', 2, 2, 0, 0, '0.309', 4), rowIntl(2, 'England', 2, 1, 1, 0, '0.421', 2), rowIntl(3, 'Kenya', 2, 0, 2, 0, '-0.730', 0)]), t20g('Group C', [rowIntl(1, 'Sri Lanka', 2, 2, 0, 0, '1.850', 4), rowIntl(2, 'Australia', 2, 1, 1, 0, '0.350', 2), rowIntl(3, 'Bangladesh', 2, 0, 2, 0, '-2.200', 0)]), t20g('Group D', [rowIntl(1, 'Pakistan', 2, 2, 0, 0, '0.758', 4), rowIntl(2, 'India', 2, 1, 1, 0, '0.350', 2), rowIntl(3, 'South Africa', 2, 0, 2, 0, '-1.108', 0)])] },
  2009: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'South Africa', 3, 2, 1, 0, '0.787', 4), rowIntl(2, 'India', 3, 2, 1, 0, '0.312', 4)], conferences: [t20g('Super 8 Group E', [rowIntl(1, 'South Africa', 3, 2, 1, 0, '0.787', 4), rowIntl(2, 'India', 3, 2, 1, 0, '0.312', 4), rowIntl(3, 'England', 3, 1, 2, 0, '-0.412', 2), rowIntl(4, 'West Indies', 3, 1, 2, 0, '-0.687', 2)]), t20g('Super 8 Group F', [rowIntl(1, 'Sri Lanka', 3, 3, 0, 0, '1.283', 6), rowIntl(2, 'Pakistan', 3, 2, 1, 0, '0.398', 4), rowIntl(3, 'New Zealand', 3, 1, 2, 0, '-0.169', 2), rowIntl(4, 'Ireland', 3, 0, 3, 0, '-1.512', 0)])] },
  2010: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Australia', 2, 2, 0, 0, '1.525', 4), rowIntl(2, 'Pakistan', 2, 1, 1, 0, '-0.325', 2)], conferences: [t20g('Group A', [rowIntl(1, 'Pakistan', 2, 2, 0, 0, '1.200', 4), rowIntl(2, 'Bangladesh', 2, 1, 1, 0, '-0.350', 2), rowIntl(3, 'Australia', 2, 0, 2, 0, '-0.850', 0)]), t20g('Group B', [rowIntl(1, 'Sri Lanka', 2, 2, 0, 0, '1.100', 4), rowIntl(2, 'New Zealand', 2, 1, 1, 0, '-0.100', 2), rowIntl(3, 'Zimbabwe', 2, 0, 2, 0, '-1.000', 0)]), t20g('Group C', [rowIntl(1, 'India', 2, 2, 0, 0, '0.950', 4), rowIntl(2, 'South Africa', 2, 1, 1, 0, '0.025', 2), rowIntl(3, 'Afghanistan', 2, 0, 2, 0, '-0.975', 0)]), t20g('Group D', [rowIntl(1, 'West Indies', 2, 2, 0, 0, '0.650', 4), rowIntl(2, 'England', 2, 1, 1, 0, '-0.150', 2), rowIntl(3, 'Ireland', 2, 0, 2, 0, '-0.500', 0)])] },
  2012: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'West Indies', 5, 4, 1, 0, '0.359', 8), rowIntl(2, 'England', 5, 3, 2, 0, '0.145', 6)], conferences: [t20g('Super 8 Group 1', [rowIntl(1, 'West Indies', 3, 3, 0, 0, '0.359', 6), rowIntl(2, 'England', 3, 2, 1, 0, '0.145', 4), rowIntl(3, 'New Zealand', 3, 1, 2, 0, '-0.169', 2), rowIntl(4, 'Sri Lanka', 3, 0, 3, 0, '-0.335', 0)]), t20g('Super 8 Group 2', [rowIntl(1, 'Sri Lanka', 3, 3, 0, 0, '0.998', 6), rowIntl(2, 'West Indies', 3, 2, 1, 0, '0.573', 4), rowIntl(3, 'England', 3, 1, 2, 0, '-0.375', 2), rowIntl(4, 'New Zealand', 3, 0, 3, 0, '-1.196', 0)])] },
  2014: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'Sri Lanka', 5, 4, 1, 0, '0.518', 8), rowIntl(2, 'India', 5, 4, 1, 0, '0.398', 8)], conferences: [t20g('Group 1', [rowIntl(1, 'Sri Lanka', 4, 3, 1, 0, '0.518', 6), rowIntl(2, 'South Africa', 4, 3, 1, 0, '0.398', 6), rowIntl(3, 'New Zealand', 4, 2, 2, 0, '0.102', 4), rowIntl(4, 'England', 4, 1, 3, 0, '-0.312', 2), rowIntl(5, 'Netherlands', 4, 1, 3, 0, '-0.706', 2)]), t20g('Group 2', [rowIntl(1, 'India', 4, 4, 0, 0, '1.275', 8), rowIntl(2, 'West Indies', 4, 2, 2, 0, '-0.075', 4), rowIntl(3, 'Pakistan', 4, 2, 2, 0, '-0.198', 4), rowIntl(4, 'Australia', 4, 1, 3, 0, '-0.486', 2), rowIntl(5, 'Bangladesh', 4, 1, 3, 0, '-0.516', 2)])] },
  2016: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'New Zealand', 4, 4, 0, 0, '1.900', 8), rowIntl(2, 'India', 4, 3, 1, 0, '0.359', 6)], conferences: [t20g('Super 10 Group 1', [rowIntl(1, 'West Indies', 4, 3, 1, 0, '0.359', 6), rowIntl(2, 'England', 4, 3, 1, 0, '0.145', 6), rowIntl(3, 'South Africa', 4, 2, 2, 0, '0.102', 4), rowIntl(4, 'Sri Lanka', 4, 1, 3, 0, '-0.312', 2), rowIntl(5, 'Afghanistan', 4, 0, 4, 0, '-0.294', 0)]), t20g('Super 10 Group 2', [rowIntl(1, 'New Zealand', 4, 4, 0, 0, '1.900', 8), rowIntl(2, 'India', 4, 3, 1, 0, '-0.305', 6), rowIntl(3, 'Australia', 4, 2, 2, 0, '0.233', 4), rowIntl(4, 'Pakistan', 4, 1, 3, 0, '-0.296', 2), rowIntl(5, 'Bangladesh', 4, 0, 4, 0, '-1.532', 0)])] },
  2021: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'England', 5, 4, 1, 0, '1.855', 8), rowIntl(2, 'Pakistan', 5, 5, 0, 0, '0.738', 10)], conferences: [t20g('Group 1', [rowIntl(1, 'England', 5, 4, 1, 0, '1.855', 8), rowIntl(2, 'Australia', 5, 4, 1, 0, '1.031', 8), rowIntl(3, 'South Africa', 5, 4, 1, 0, '0.739', 8), rowIntl(4, 'Sri Lanka', 5, 2, 3, 0, '-0.269', 4), rowIntl(5, 'West Indies', 5, 1, 4, 0, '-1.641', 2), rowIntl(6, 'Bangladesh', 5, 0, 5, 0, '-2.383', 0)]), t20g('Group 2', [rowIntl(1, 'Pakistan', 5, 5, 0, 0, '0.738', 10), rowIntl(2, 'New Zealand', 5, 4, 1, 0, '0.302', 8), rowIntl(3, 'India', 5, 3, 2, 0, '1.619', 6), rowIntl(4, 'Afghanistan', 5, 2, 3, 0, '0.573', 4), rowIntl(5, 'Namibia', 5, 1, 4, 0, '-1.287', 2), rowIntl(6, 'Scotland', 5, 0, 5, 0, '-1.945', 0)])] },
  2022: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'England', 6, 5, 1, 0, '0.473', 10), rowIntl(2, 'Pakistan', 6, 5, 1, 0, '0.597', 10)], conferences: [t20g('Group 1', [rowIntl(1, 'New Zealand', 5, 3, 1, 1, '2.113', 7), rowIntl(2, 'England', 5, 3, 1, 1, '0.473', 7), rowIntl(3, 'Australia', 5, 3, 1, 1, '-0.173', 7), rowIntl(4, 'Sri Lanka', 5, 2, 3, 0, '-0.422', 4), rowIntl(5, 'Afghanistan', 5, 1, 4, 0, '-0.718', 2), rowIntl(6, 'Ireland', 5, 0, 4, 1, '-1.615', 1)]), t20g('Group 2', [rowIntl(1, 'India', 5, 4, 1, 0, '1.319', 8), rowIntl(2, 'Pakistan', 5, 4, 1, 0, '0.597', 8), rowIntl(3, 'South Africa', 5, 2, 3, 0, '0.098', 4), rowIntl(4, 'Bangladesh', 5, 2, 3, 0, '-1.176', 4), rowIntl(5, 'Netherlands', 5, 2, 3, 0, '-0.849', 4), rowIntl(6, 'Zimbabwe', 5, 1, 4, 0, '-1.138', 2)])] },
  2024: { columns: CRICKET_COLUMNS, rows: [rowIntl(1, 'India', 7, 6, 0, 1, '1.418', 13), rowIntl(2, 'South Africa', 8, 7, 1, 0, '0.506', 14)], conferences: [t20g('Group A', [rowIntl(1, 'India', 4, 3, 0, 1, '1.137', 7), rowIntl(2, 'USA', 4, 2, 1, 1, '0.127', 5), rowIntl(3, 'Pakistan', 4, 2, 2, 0, '-0.150', 4), rowIntl(4, 'Canada', 4, 1, 2, 1, '-0.493', 3), rowIntl(5, 'Ireland', 4, 0, 3, 1, '-0.621', 1)]), t20g('Group B', [rowIntl(1, 'Australia', 4, 4, 0, 0, '2.791', 8), rowIntl(2, 'England', 4, 2, 1, 1, '0.412', 5), rowIntl(3, 'Scotland', 4, 2, 1, 1, '0.304', 5), rowIntl(4, 'Namibia', 4, 1, 3, 0, '-2.098', 2), rowIntl(5, 'Oman', 4, 0, 4, 0, '-1.409', 0)]), t20g('Group C', [rowIntl(1, 'West Indies', 4, 4, 0, 0, '2.596', 8), rowIntl(2, 'Afghanistan', 4, 3, 1, 0, '0.639', 6), rowIntl(3, 'New Zealand', 4, 2, 2, 0, '0.382', 4), rowIntl(4, 'Uganda', 4, 1, 3, 0, '-2.152', 2), rowIntl(5, 'Papua New Guinea', 4, 0, 4, 0, '-1.465', 0)]), t20g('Group D', [rowIntl(1, 'South Africa', 4, 4, 0, 0, '0.603', 8), rowIntl(2, 'Bangladesh', 4, 3, 1, 0, '0.478', 6), rowIntl(3, 'Sri Lanka', 4, 1, 2, 1, '-0.275', 3), rowIntl(4, 'Netherlands', 4, 1, 3, 0, '-0.408', 2), rowIntl(5, 'Nepal', 4, 0, 3, 1, '-0.398', 1)])] }
};

const FALLBACK_BY_LEAGUE = { ipl: IPL, psl: PSL, bbl: BBL, ilt20: ILT20, sa20: SA20, ranji: RANJI, sheffield: SHEFFIELD, county: COUNTY, icc_test: ICC_TEST, t20wc: T20WC };

/**
 * Returns fallback standings for a cricket league and season, or null if none.
 * For years before a league started (e.g. BBL 2008–2011), returns a single-row placeholder so the UI stays functional.
 * For years in range but with no data (e.g. ICC Test non-cycle years), returns a placeholder.
 */
export function getCricketStandingsFallback(leagueKey, seasonYear) {
  const league = FALLBACK_BY_LEAGUE[leagueKey];
  if (!league || !seasonYear) return null;
  const data = league[seasonYear];
  if (data?.rows?.length > 0 || data?.conferences?.length > 0) return data;
  const startYear = LEAGUE_START_YEAR[leagueKey];
  if (startYear != null && seasonYear >= 2008 && seasonYear < startYear)
    return placeholderTable(`No standings — league started ${startYear}`);
  if (seasonYear >= 2008 && seasonYear <= new Date().getFullYear() + 1)
    return placeholderTable('No standings for this season');
  return data || null;
}

/**
 * Returns true if the parsed table has no meaningful stats (all zeros for W/L/PT).
 */
export function isCricketTableEmpty(rows) {
  if (!rows || rows.length === 0) return true;
  const keyStats = ['W', 'L', 'PT'];
  const hasValue = (r) => {
    const v = r.values || {};
    return keyStats.some((k) => {
      const val = v[k];
      return val != null && val !== '' && val !== '0' && val !== '-';
    });
  };
  return !rows.some(hasValue);
}

export { CRICKET_COLUMNS };
export { LEAGUE_START_YEAR };

/** T20 World Cup is only held in certain years; use these for the season dropdown. */
export const T20WC_EDITION_YEARS = [2007, 2009, 2010, 2012, 2014, 2016, 2021, 2022, 2024, 2026];

/**
 * Returns the list of season years to show in the selector for a cricket league.
 * From league start year through current+1; for T20 WC returns only edition years.
 */
export function getCricketSeasonYears(leagueKey) {
  if (leagueKey === 't20wc') return [...T20WC_EDITION_YEARS].reverse();
  const start = LEAGUE_START_YEAR[leagueKey];
  if (start == null) return [];
  const maxYear = new Date().getFullYear() + 1;
  const years = [];
  for (let y = maxYear; y >= start; y--) years.push(y);
  return years;
}
