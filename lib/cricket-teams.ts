/**
 * Cricket teams static data
 *
 * ESPN's unofficial API does not expose cricket teams via the standard
 * /teams endpoint. This file provides fallback team data so the Teams
 * and Players pages work even during off-season.
 *
 * Logo URLs are sourced from Wikimedia Commons (freely accessible).
 * Colors are official brand / kit colors for each franchise.
 */

export interface CricketTeam {
  id: string;
  name: string;
  shortName: string;
  abbr: string;
  logo: string | null;
  color: string;
  leagueId: string;
  leagueName: string;
}

// ─── IPL ─────────────────────────────────────────────────────────────────────
const IPL: CricketTeam[] = [
  { id: "mi",   name: "Mumbai Indians",          shortName: "Mumbai Indians",   abbr: "MI",   logo: "https://upload.wikimedia.org/wikipedia/en/c/cd/Mumbai_Indians_Logo.svg",          color: "#004ba0", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "csk",  name: "Chennai Super Kings",      shortName: "Chennai Super Kgs",abbr: "CSK",  logo: "https://upload.wikimedia.org/wikipedia/en/2/2b/Chennai_Super_Kings_Logo.svg",       color: "#fdb913", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "rcb",  name: "Royal Challengers Bengaluru", shortName: "RC Bengaluru", abbr: "RCB",  logo: "https://upload.wikimedia.org/wikipedia/en/2/2a/Royal_Challengers_Bengaluru_2024.svg",color: "#ec1c24", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "kkr",  name: "Kolkata Knight Riders",    shortName: "Kolkata KR",       abbr: "KKR",  logo: "https://upload.wikimedia.org/wikipedia/en/4/4c/Kolkata_Knight_Riders_Logo.svg",     color: "#3a225d", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "srh",  name: "Sunrisers Hyderabad",       shortName: "Sunrisers Hyd",    abbr: "SRH",  logo: "https://upload.wikimedia.org/wikipedia/en/9/9e/SunRisers_Hyderabad_Logo.svg",       color: "#f7a721", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "dc",   name: "Delhi Capitals",            shortName: "Delhi Capitals",   abbr: "DC",   logo: "https://upload.wikimedia.org/wikipedia/en/2/2f/Delhi_Capitals_Logo.svg",            color: "#0078bc", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "rr",   name: "Rajasthan Royals",          shortName: "Rajasthan Royals", abbr: "RR",   logo: "https://upload.wikimedia.org/wikipedia/en/6/60/Rajasthan_Royals_Logo.svg",          color: "#e8618c", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "pbks", name: "Punjab Kings",              shortName: "Punjab Kings",     abbr: "PBKS", logo: "https://upload.wikimedia.org/wikipedia/en/d/d4/Punjab_Kings_Logo_2021.svg",         color: "#aa4545", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "gt",   name: "Gujarat Titans",            shortName: "Gujarat Titans",   abbr: "GT",   logo: "https://upload.wikimedia.org/wikipedia/en/0/09/Gujarat_Titans_Logo.svg",            color: "#1c2951", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "lsg",  name: "Lucknow Super Giants",      shortName: "Lucknow Super G",  abbr: "LSG",  logo: "https://upload.wikimedia.org/wikipedia/en/b/b2/Lucknow_Super_Giants_Logo.svg",      color: "#a72b2a", leagueId: "ipl", leagueName: "Indian Premier League" },
];

// ─── Big Bash League ──────────────────────────────────────────────────────────
const BBL: CricketTeam[] = [
  { id: "bbl.sixers",     name: "Sydney Sixers",        shortName: "Sydney Sixers",    abbr: "SIX", logo: "https://upload.wikimedia.org/wikipedia/en/d/d5/Sydney_Sixers_logo.png",           color: "#ff69b4", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.stars",      name: "Melbourne Stars",      shortName: "Melbourne Stars",  abbr: "STA", logo: "https://upload.wikimedia.org/wikipedia/en/e/e8/Melbourne_Stars_logo.png",          color: "#00a950", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.heat",       name: "Brisbane Heat",        shortName: "Brisbane Heat",    abbr: "HEA", logo: "https://upload.wikimedia.org/wikipedia/en/0/05/Brisbane_Heat_logo.png",            color: "#ff6a00", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.scorchers",  name: "Perth Scorchers",      shortName: "Perth Scorchers",  abbr: "SCO", logo: "https://upload.wikimedia.org/wikipedia/en/3/30/Perth_Scorchers_logo.png",          color: "#f15a22", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.renegades",  name: "Melbourne Renegades",  shortName: "Melb Renegades",   abbr: "REN", logo: "https://upload.wikimedia.org/wikipedia/en/4/4d/Melbourne_Renegades_logo.png",      color: "#e50000", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.strikers",   name: "Adelaide Strikers",    shortName: "Adel Strikers",    abbr: "STR", logo: "https://upload.wikimedia.org/wikipedia/en/3/3e/Adelaide_Strikers_logo.png",        color: "#00b0f0", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.hurricanes", name: "Hobart Hurricanes",    shortName: "Hobart Hurricanes",abbr: "HUR", logo: "https://upload.wikimedia.org/wikipedia/en/9/92/Hobart_Hurricanes_logo.png",        color: "#7209b7", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.thunder",    name: "Sydney Thunder",       shortName: "Sydney Thunder",   abbr: "THU", logo: "https://upload.wikimedia.org/wikipedia/en/9/97/Sydney_Thunder_logo.png",           color: "#228b22", leagueId: "big.bash", leagueName: "Big Bash League" },
];

// ─── Pakistan Super League ────────────────────────────────────────────────────
const PSL: CricketTeam[] = [
  { id: "psl.karachi",    name: "Karachi Kings",     shortName: "Karachi Kings",   abbr: "KAR", logo: null, color: "#0050a0", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.lahore",     name: "Lahore Qalandars",  shortName: "Lahore Qalandars",abbr: "LAH", logo: null, color: "#006400", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.multan",     name: "Multan Sultans",    shortName: "Multan Sultans",  abbr: "MUL", logo: null, color: "#003087", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.islamabad",  name: "Islamabad United",  shortName: "Islamabad United",abbr: "ISL", logo: null, color: "#c8102e", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.peshawar",   name: "Peshawar Zalmi",    shortName: "Peshawar Zalmi",  abbr: "PES", logo: null, color: "#ff8c00", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.quetta",     name: "Quetta Gladiators", shortName: "Quetta Gladiators",abbr: "QUE", logo: null, color: "#6a0dad", leagueId: "psl", leagueName: "Pakistan Super League" },
];

// ─── Caribbean Premier League ─────────────────────────────────────────────────
const CPL: CricketTeam[] = [
  { id: "cpl.trinbago",  name: "Trinbago Knight Riders",  shortName: "Trinbago KR",    abbr: "TKR", logo: null, color: "#3a225d", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.barbados",  name: "Barbados Royals",          shortName: "Barbados Royals",abbr: "BR",  logo: null, color: "#003087", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.guyana",    name: "Guyana Amazon Warriors",   shortName: "Guyana Warriors",abbr: "GAW", logo: null, color: "#00704a", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.jamaica",   name: "Jamaica Tallawahs",        shortName: "Jamaica Tallawahs",abbr: "JT",logo: null, color: "#f5a800", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.stlucia",   name: "Saint Lucia Kings",        shortName: "St Lucia Kings", abbr: "SLK", logo: null, color: "#00b2a9", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.antigua",   name: "Antigua & Barbuda Falcons",shortName: "AB Falcons",      abbr: "ABF", logo: null, color: "#0052a5", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
];

// ─── SA20 ─────────────────────────────────────────────────────────────────────
const SA20: CricketTeam[] = [
  { id: "sa20.capetown",   name: "MI Cape Town",         shortName: "MI Cape Town",   abbr: "MICT", logo: null, color: "#003087", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.joburg",     name: "Joburg Super Kings",   shortName: "Joburg SK",      abbr: "JSK",  logo: null, color: "#fdb913", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.durban",     name: "Durban Super Giants",  shortName: "Durban SG",      abbr: "DSG",  logo: null, color: "#0048a0", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.pretoria",   name: "Pretoria Capitals",    shortName: "Pretoria Caps",  abbr: "PC",   logo: null, color: "#f05023", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.paarl",      name: "Paarl Royals",         shortName: "Paarl Royals",   abbr: "PR",   logo: null, color: "#e8618c", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.sunrisers",  name: "Sunrisers Eastern Cape",shortName: "Sunrisers EC",  abbr: "SEC",  logo: null, color: "#f7a721", leagueId: "sa.domestic", leagueName: "SA20" },
];

// ─── County Championship ──────────────────────────────────────────────────────
const COUNTY: CricketTeam[] = [
  { id: "cc.yorkshire",   name: "Yorkshire",          shortName: "Yorkshire",    abbr: "YOR", logo: null, color: "#003087", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.surrey",      name: "Surrey",             shortName: "Surrey",       abbr: "SUR", logo: null, color: "#1c4f9c", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.lancashire",  name: "Lancashire",         shortName: "Lancashire",   abbr: "LAN", logo: null, color: "#e50000", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.essex",       name: "Essex",              shortName: "Essex",        abbr: "ESS", logo: null, color: "#e50000", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.kent",        name: "Kent",               shortName: "Kent",         abbr: "KEN", logo: null, color: "#b01c2e", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.warwickshire",name: "Warwickshire",       shortName: "Warwickshire", abbr: "WAR", logo: null, color: "#003087", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.nottinghamshire", name: "Nottinghamshire",shortName: "Notts",        abbr: "NOT", logo: null, color: "#d4a017", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.hampshire",   name: "Hampshire",          shortName: "Hampshire",    abbr: "HAM", logo: null, color: "#003087", leagueId: "eng.domestic", leagueName: "County Championship" },
];


// ─── ILT20 (International League T20 — UAE/Dubai) ────────────────────────────
const ILT20: CricketTeam[] = [
  { id: "ilt20.adkr",  name: "Abu Dhabi Knight Riders", shortName: "Abu Dhabi KR",  abbr: "ADKR", logo: null, color: "#3a225d", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.dv",    name: "Desert Vipers",           shortName: "Desert Vipers", abbr: "DV",   logo: null, color: "#1a5c2a", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.dc",    name: "Dubai Capitals",          shortName: "Dubai Capitals",abbr: "DC",   logo: null, color: "#004ba0", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.gg",    name: "Gulf Giants",             shortName: "Gulf Giants",   abbr: "GG",   logo: null, color: "#8b0000", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.mie",   name: "MI Emirates",             shortName: "MI Emirates",   abbr: "MIE",  logo: null, color: "#004ba0", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.sw",    name: "Sharjah Warriors",        shortName: "Sharjah Warriors",abbr: "SW", logo: null, color: "#c8a000", leagueId: "ilt20", leagueName: "Int'l League T20" },
];

// ─── Major League Cricket (USA) ───────────────────────────────────────────────
const MLC: CricketTeam[] = [
  { id: "mlc.miny",    name: "MI New York",              shortName: "MI New York",   abbr: "MINY", logo: null, color: "#004ba0", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.sea",     name: "Seattle Orcas",            shortName: "Seattle Orcas", abbr: "SEA",  logo: null, color: "#00704a", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.tsk",     name: "Texas Super Kings",        shortName: "Texas SKs",     abbr: "TSK",  logo: null, color: "#fdb913", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.sfu",     name: "San Francisco Unicorns",   shortName: "SF Unicorns",   abbr: "SFU",  logo: null, color: "#6a0dad", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.waf",     name: "Washington Freedom",       shortName: "Washington F",  abbr: "WAF",  logo: null, color: "#c8102e", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.lakr",    name: "LA Knight Riders",         shortName: "LA Knight Rs",  abbr: "LAKR", logo: null, color: "#3a225d", leagueId: "mlc", leagueName: "Major League Cricket" },
];

// ─── Lanka Premier League (Sri Lanka) ────────────────────────────────────────
const LPL: CricketTeam[] = [
  { id: "lpl.cs",      name: "Colombo Strikers",        shortName: "Colombo Str",  abbr: "CS",  logo: null, color: "#003087", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.da",      name: "Dambulla Aura",           shortName: "Dambulla Aura",abbr: "DA",  logo: null, color: "#004d00", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.gm",      name: "Galle Marvels",           shortName: "Galle Marvels",abbr: "GM",  logo: null, color: "#00704a", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.jk",      name: "Jaffna Kings",            shortName: "Jaffna Kings", abbr: "JK",  logo: null, color: "#fdb913", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.kf",      name: "Kandy Falcons",           shortName: "Kandy Falcons",abbr: "KF",  logo: null, color: "#c8102e", leagueId: "lpl", leagueName: "Lanka Premier League" },
];

// ─── Bangladesh Premier League ────────────────────────────────────────────────
const BPL: CricketTeam[] = [
  { id: "bpl.comilla",  name: "Comilla Victorians",    shortName: "Comilla Vic",  abbr: "CV",  logo: null, color: "#003087", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.dhaka",    name: "Dhaka Dominators",      shortName: "Dhaka Dom",    abbr: "DD",  logo: null, color: "#c8102e", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.sylhet",   name: "Sylhet Strikers",       shortName: "Sylhet Str",   abbr: "SS",  logo: null, color: "#006400", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.chittagong",name: "Chittagong Kings",     shortName: "Chitt Kings",  abbr: "CK",  logo: null, color: "#fdb913", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.fortune",  name: "Fortune Barishal",      shortName: "Fortune Bar",  abbr: "FB",  logo: null, color: "#6a0dad", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.rangpur",  name: "Rangpur Riders",        shortName: "Rangpur Ride", abbr: "RR",  logo: null, color: "#e65100", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
];

// ─── GT20 Canada ──────────────────────────────────────────────────────────────
const GT20: CricketTeam[] = [
  { id: "gt20.brampton",  name: "Brampton Wolves",    shortName: "Brampton Wlvs", abbr: "BW",  logo: null, color: "#003087", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.montreal",  name: "Montreal Tigers",    shortName: "Montreal Tgrs", abbr: "MT",  logo: null, color: "#e50000", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.toronto",   name: "Toronto Nationals",  shortName: "Toronto Nat",   abbr: "TN",  logo: null, color: "#d4a017", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.vancouver", name: "Vancouver Knights",  shortName: "Vancouver Kng", abbr: "VK",  logo: null, color: "#00704a", leagueId: "gt20", leagueName: "GT20 Canada" },
];

// ─── Sheffield Shield (Australia domestic) ───────────────────────────────────
const SHEFFIELD_SHIELD: CricketTeam[] = [
  { id: "ss.nsw",  name: "New South Wales Blues",  shortName: "NSW Blues",     abbr: "NSW",  logo: null, color: "#003087", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.vic",  name: "Victoria Bushrangers",   shortName: "VIC Bushrangers",abbr: "VIC", logo: null, color: "#002664", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.qld",  name: "Queensland Bulls",       shortName: "QLD Bulls",     abbr: "QLD",  logo: null, color: "#c8102e", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.sa",   name: "South Australia Redbacks",shortName: "SA Redbacks",  abbr: "SA",   logo: null, color: "#e50000", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.wa",   name: "Western Australia Warriors",shortName: "WA Warriors", abbr: "WA",  logo: null, color: "#fdb913", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.tas",  name: "Tasmania Tigers",        shortName: "Tasmania Tgrs", abbr: "TAS",  logo: null, color: "#ff8c00", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
];

// ─── Plunket Shield (New Zealand domestic) ───────────────────────────────────
const PLUNKET_SHIELD: CricketTeam[] = [
  { id: "nz.auckland",     name: "Auckland Aces",          shortName: "Auckland Aces",  abbr: "AKL", logo: null, color: "#003087", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.wellington",   name: "Wellington Firebirds",   shortName: "Wellington FB",  abbr: "WGN", logo: null, color: "#ff6a00", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.canterbury",   name: "Canterbury Kings",       shortName: "Canterbury Kgs", abbr: "CAN", logo: null, color: "#c8102e", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.otago",        name: "Otago Volts",            shortName: "Otago Volts",    abbr: "OTG", logo: null, color: "#fdb913", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.centraldistr", name: "Central Districts",      shortName: "Central Dists",  abbr: "CD",  logo: null, color: "#006400", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.northernknts", name: "Northern Knights",       shortName: "Northern Knts",  abbr: "ND",  logo: null, color: "#003087", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
];

// ─── All National Teams (for WTC, Tests, ICC events) ─────────────────────────
const NATIONAL_TEAMS: CricketTeam[] = [
  { id: "nat.ind", name: "India",        shortName: "India",        abbr: "IND", logo: "https://upload.wikimedia.org/wikipedia/en/8/8d/Cricket_India_Crest.svg",             color: "#003087", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.aus", name: "Australia",    shortName: "Australia",    abbr: "AUS", logo: "https://upload.wikimedia.org/wikipedia/en/a/a4/Cricket_Australia.svg",               color: "#f5a800", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.eng", name: "England",      shortName: "England",      abbr: "ENG", logo: "https://upload.wikimedia.org/wikipedia/en/9/9d/England_Cricket.svg",                 color: "#002664", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.pak", name: "Pakistan",     shortName: "Pakistan",     abbr: "PAK", logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/PCB_Official_Logo.svg",               color: "#006400", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.sa",  name: "South Africa", shortName: "South Africa", abbr: "SA",  logo: "https://upload.wikimedia.org/wikipedia/en/a/a1/Cricket_South_Africa_logo.png",       color: "#007a4d", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.nz",  name: "New Zealand",  shortName: "New Zealand",  abbr: "NZ",  logo: "https://upload.wikimedia.org/wikipedia/en/c/c3/New_Zealand_Cricket_Logo.svg",        color: "#000000", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.wi",  name: "West Indies",  shortName: "West Indies",  abbr: "WI",  logo: "https://upload.wikimedia.org/wikipedia/en/9/9e/West_Indies_Cricket_Board_Logo.svg",  color: "#7b0000", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.sl",  name: "Sri Lanka",    shortName: "Sri Lanka",    abbr: "SL",  logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sri_Lanka_Cricket_logo.png",          color: "#003087", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.ban", name: "Bangladesh",   shortName: "Bangladesh",   abbr: "BAN", logo: null,                                                                                   color: "#006a4e", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.afg", name: "Afghanistan",  shortName: "Afghanistan",  abbr: "AFG", logo: null,                                                                                   color: "#003087", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.zim", name: "Zimbabwe",     shortName: "Zimbabwe",     abbr: "ZIM", logo: null,                                                                                   color: "#006400", leagueId: "icc.wtc",  leagueName: "World Test Championship" },
  { id: "nat.ire", name: "Ireland",      shortName: "Ireland",      abbr: "IRE", logo: null,                                                                                   color: "#009a44", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.ned", name: "Netherlands",  shortName: "Netherlands",  abbr: "NED", logo: null,                                                                                   color: "#ff6700", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.sco", name: "Scotland",     shortName: "Scotland",     abbr: "SCO", logo: null,                                                                                   color: "#003399", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.uga", name: "Uganda",       shortName: "Uganda",       abbr: "UGA", logo: null,                                                                                   color: "#000000", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.usa", name: "USA",          shortName: "USA",          abbr: "USA", logo: null,                                                                                   color: "#002868", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.png", name: "Papua New Guinea",shortName: "PNG",       abbr: "PNG", logo: null,                                                                                   color: "#000000", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.nam", name: "Namibia",      shortName: "Namibia",      abbr: "NAM", logo: null,                                                                                   color: "#003087", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.can", name: "Canada",       shortName: "Canada",       abbr: "CAN", logo: null,                                                                                   color: "#c8102e", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
  { id: "nat.oman",name: "Oman",         shortName: "Oman",         abbr: "OMA", logo: null,                                                                                   color: "#db161b", leagueId: "icc.t20wc",leagueName: "ICC T20 World Cup" },
];

// ─── All teams by league ID ───────────────────────────────────────────────────
export const CRICKET_TEAMS_BY_LEAGUE: Record<string, CricketTeam[]> = {
  "ipl":           IPL,
  "big.bash":      BBL,
  "psl":           PSL,
  "cplt20":        CPL,
  "sa.domestic":   SA20,
  "eng.domestic":  COUNTY,
  "ind.domestic":  [],    // Ranji Trophy — too many teams to hardcode (30+)
  "ilt20":         ILT20,
  "mlc":           MLC,
  "lpl":           LPL,
  "bpl":           BPL,
  "gt20":          GT20,
  "aus.domestic":  SHEFFIELD_SHIELD,
  "nz.domestic":   PLUNKET_SHIELD,
  "pak.domestic":  [], // Quaid-e-Azam Trophy — many teams
  "icc.t20wc":     NATIONAL_TEAMS,
  "icc.wc":        NATIONAL_TEAMS,
  "icc.champions": NATIONAL_TEAMS,
  "icc.wtc":       NATIONAL_TEAMS,
  "ashes":         NATIONAL_TEAMS.filter(t => ["nat.eng","nat.aus"].includes(t.id)),
  "icc.test":      NATIONAL_TEAMS,
  "icc.odi":       NATIONAL_TEAMS,
  "icc.t20i":      NATIONAL_TEAMS,
};

export function getCricketTeams(leagueId?: string): CricketTeam[] {
  if (leagueId) {
    return CRICKET_TEAMS_BY_LEAGUE[leagueId] ?? [];
  }
  // All cricket teams when no filter
  return Object.values(CRICKET_TEAMS_BY_LEAGUE).flat();
}
