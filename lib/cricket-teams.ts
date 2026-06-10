/**
 * Cricket teams static data
 *
 * ESPN's unofficial API does not expose cricket teams via the standard
 * /teams endpoint. This file provides fallback team data so the Teams
 * and Players pages work even during off-season.
 *
 * Logo URLs:
 * - IPL: Official IPL CDN (scores.iplt20.com) — reliable, no rate limit
 * - LPL/GT20: ESPNcricinfo CDN (img1.hscicdn.com) — verified 200 OK
 * - BBL/PSL/CPL/SA20/ILT20/MLC/BPL/County/Sheffield/Plunket: Wikipedia/Wikimedia
 * - National teams: Wikipedia/Wikimedia Commons
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
// Official IPL CDN — scores.iplt20.com/ipl/teamlogos/{ABBR}.png
const IPL: CricketTeam[] = [
  { id: "mi",   name: "Mumbai Indians",             shortName: "Mumbai Indians",   abbr: "MI",   logo: "https://scores.iplt20.com/ipl/teamlogos/MI.png",   color: "#004ba0", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "csk",  name: "Chennai Super Kings",        shortName: "Chennai Super Kgs",abbr: "CSK",  logo: "https://scores.iplt20.com/ipl/teamlogos/CSK.png",  color: "#fdb913", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "rcb",  name: "Royal Challengers Bengaluru",shortName: "RC Bengaluru",     abbr: "RCB",  logo: "https://scores.iplt20.com/ipl/teamlogos/RCB.png",  color: "#ec1c24", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "kkr",  name: "Kolkata Knight Riders",      shortName: "Kolkata KR",       abbr: "KKR",  logo: "https://scores.iplt20.com/ipl/teamlogos/KKR.png",  color: "#3a225d", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "srh",  name: "Sunrisers Hyderabad",        shortName: "Sunrisers Hyd",    abbr: "SRH",  logo: "https://scores.iplt20.com/ipl/teamlogos/SRH.png",  color: "#f7a721", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "dc",   name: "Delhi Capitals",             shortName: "Delhi Capitals",   abbr: "DC",   logo: "https://scores.iplt20.com/ipl/teamlogos/DC.png",   color: "#0078bc", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "rr",   name: "Rajasthan Royals",           shortName: "Rajasthan Royals", abbr: "RR",   logo: "https://scores.iplt20.com/ipl/teamlogos/RR.png",   color: "#e8618c", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "pbks", name: "Punjab Kings",               shortName: "Punjab Kings",     abbr: "PBKS", logo: "https://scores.iplt20.com/ipl/teamlogos/PBKS.png", color: "#aa4545", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "gt",   name: "Gujarat Titans",             shortName: "Gujarat Titans",   abbr: "GT",   logo: "https://scores.iplt20.com/ipl/teamlogos/GT.png",   color: "#1c2951", leagueId: "ipl", leagueName: "Indian Premier League" },
  { id: "lsg",  name: "Lucknow Super Giants",       shortName: "Lucknow Super G",  abbr: "LSG",  logo: "https://scores.iplt20.com/ipl/teamlogos/LSG.png",  color: "#a72b2a", leagueId: "ipl", leagueName: "Indian Premier League" },
];

// ─── Big Bash League ──────────────────────────────────────────────────────────
// Wikipedia thumbnail CDN (verified correct filenames)
const BBL: CricketTeam[] = [
  { id: "bbl.sixers",     name: "Sydney Sixers",        shortName: "Sydney Sixers",    abbr: "SIX", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/95/Sydney_Sixers_logo.svg/120px-Sydney_Sixers_logo.svg.png",           color: "#ff69b4", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.stars",      name: "Melbourne Stars",      shortName: "Melbourne Stars",  abbr: "STA", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/74/Melbourne_Stars_logo.svg/120px-Melbourne_Stars_logo.svg.png",        color: "#00a950", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.heat",       name: "Brisbane Heat",        shortName: "Brisbane Heat",    abbr: "HEA", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/cf/Brisbane_Heat_logo.svg/120px-Brisbane_Heat_logo.svg.png",            color: "#ff6a00", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.scorchers",  name: "Perth Scorchers",      shortName: "Perth Scorchers",  abbr: "SCO", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/15/Perth_Scorchers_logo.svg/120px-Perth_Scorchers_logo.svg.png",        color: "#f15a22", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.renegades",  name: "Melbourne Renegades",  shortName: "Melb Renegades",   abbr: "REN", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/63/Melbourne_Renegades_Logo.svg/120px-Melbourne_Renegades_Logo.svg.png", color: "#e50000", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.strikers",   name: "Adelaide Strikers",    shortName: "Adel Strikers",    abbr: "STR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/72/Adelaide_Strikers_logo.svg/120px-Adelaide_Strikers_logo.svg.png",    color: "#00b0f0", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.hurricanes", name: "Hobart Hurricanes",    shortName: "Hobart Hurricanes",abbr: "HUR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c3/Hobart_Hurricanes_logo.svg/120px-Hobart_Hurricanes_logo.svg.png",    color: "#7209b7", leagueId: "big.bash", leagueName: "Big Bash League" },
  { id: "bbl.thunder",    name: "Sydney Thunder",       shortName: "Sydney Thunder",   abbr: "THU", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/86/Sydney_Thunder_logo.svg/120px-Sydney_Thunder_logo.svg.png",           color: "#228b22", leagueId: "big.bash", leagueName: "Big Bash League" },
];

// ─── Pakistan Super League ────────────────────────────────────────────────────
const PSL: CricketTeam[] = [
  { id: "psl.karachi",    name: "Karachi Kings",     shortName: "Karachi Kings",    abbr: "KAR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/Karachi_Kings.png/120px-Karachi_Kings.png",             color: "#0050a0", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.lahore",     name: "Lahore Qalandars",  shortName: "Lahore Qalandars", abbr: "LAH", logo: "https://upload.wikimedia.org/wikipedia/en/6/63/Lahore_Qalandars.png",                                        color: "#006400", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.multan",     name: "Multan Sultans",    shortName: "Multan Sultans",   abbr: "MUL", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/c2/Multan_Sultans.svg/120px-Multan_Sultans.svg.png",       color: "#003087", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.islamabad",  name: "Islamabad United",  shortName: "Islamabad United", abbr: "ISL", logo: "https://upload.wikimedia.org/wikipedia/en/9/92/Islamabad_United.png",                                        color: "#c8102e", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.peshawar",   name: "Peshawar Zalmi",    shortName: "Peshawar Zalmi",   abbr: "PES", logo: "https://upload.wikimedia.org/wikipedia/en/9/9c/Peshawar_Zalmi_logo.png",                                    color: "#ff8c00", leagueId: "psl", leagueName: "Pakistan Super League" },
  { id: "psl.quetta",     name: "Quetta Gladiators", shortName: "Quetta Gladiators",abbr: "QUE", logo: "https://upload.wikimedia.org/wikipedia/en/d/d2/Quetta_Gladiators.png",                                      color: "#6a0dad", leagueId: "psl", leagueName: "Pakistan Super League" },
];

// ─── Caribbean Premier League ─────────────────────────────────────────────────
const CPL: CricketTeam[] = [
  { id: "cpl.trinbago",  name: "Trinbago Knight Riders",   shortName: "Trinbago KR",     abbr: "TKR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/b/bf/Trinbago_Knight_Riders_logo.svg/120px-Trinbago_Knight_Riders_logo.svg.png", color: "#3a225d", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.barbados",  name: "Barbados Royals",           shortName: "Barbados Royals", abbr: "BR",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d7/Barbados_Tridents_New_Logo.svg/120px-Barbados_Tridents_New_Logo.svg.png",   color: "#003087", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.guyana",    name: "Guyana Amazon Warriors",    shortName: "Guyana Warriors", abbr: "GAW", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/eb/Guyana_Amazon_Warriors_%28logo%29.svg/120px-Guyana_Amazon_Warriors_%28logo%29.svg.png", color: "#00704a", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.jamaica",   name: "Jamaica Tallawahs",         shortName: "Jamaica Tallawahs",abbr: "JT", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/4f/CPL_JAM.svg/120px-CPL_JAM.svg.png",                                           color: "#f5a800", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.stlucia",   name: "Saint Lucia Kings",         shortName: "St Lucia Kings",  abbr: "SLK", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/77/Saint_Lucia_Kings_svg_logo.svg/120px-Saint_Lucia_Kings_svg_logo.svg.png",   color: "#00b2a9", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
  { id: "cpl.antigua",   name: "Antigua & Barbuda Falcons", shortName: "AB Falcons",      abbr: "ABF", logo: "https://upload.wikimedia.org/wikipedia/en/8/83/Antigua_%26_Barbuda_Falcon.png",                                                     color: "#0052a5", leagueId: "cplt20", leagueName: "Caribbean Premier Lge" },
];

// ─── SA20 ─────────────────────────────────────────────────────────────────────
const SA20: CricketTeam[] = [
  { id: "sa20.capetown",  name: "MI Cape Town",          shortName: "MI Cape Town",   abbr: "MICT", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/53/MI_Cape_Town_%E2%80%93_Logo.svg/120px-MI_Cape_Town_%E2%80%93_Logo.svg.png",           color: "#003087", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.joburg",    name: "Joburg Super Kings",    shortName: "Joburg SK",      abbr: "JSK",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/c/ca/Joburg_Super_Kings_Logo.svg/120px-Joburg_Super_Kings_Logo.svg.png",                   color: "#fdb913", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.durban",    name: "Durban's Super Giants", shortName: "Durban SG",      abbr: "DSG",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8c/Durban%27s_Super_Giants_Logo.svg/120px-Durban%27s_Super_Giants_Logo.svg.png",         color: "#0048a0", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.pretoria",  name: "Pretoria Capitals",     shortName: "Pretoria Caps",  abbr: "PC",   logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/fa/Pretoria_Capitals_logo.svg/120px-Pretoria_Capitals_logo.svg.png",                     color: "#f05023", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.paarl",     name: "Paarl Royals",          shortName: "Paarl Royals",   abbr: "PR",   logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8e/Paarl_Royals_logo_%282%29.svg/120px-Paarl_Royals_logo_%282%29.svg.png",               color: "#e8618c", leagueId: "sa.domestic", leagueName: "SA20" },
  { id: "sa20.sunrisers", name: "Sunrisers Eastern Cape",shortName: "Sunrisers EC",   abbr: "SEC",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/82/Sunrisers_Eastern_Cape_Logo.svg/120px-Sunrisers_Eastern_Cape_Logo.svg.png",           color: "#f7a721", leagueId: "sa.domestic", leagueName: "SA20" },
];

// ─── County Championship ──────────────────────────────────────────────────────
const COUNTY: CricketTeam[] = [
  { id: "cc.yorkshire",       name: "Yorkshire",      shortName: "Yorkshire",    abbr: "YOR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Yorkshire_County_Cricket_Club_logo.svg/120px-Yorkshire_County_Cricket_Club_logo.svg.png",             color: "#003087", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.surrey",          name: "Surrey",         shortName: "Surrey",       abbr: "SUR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a3/Surrey_County_Cricket_1_Club.svg/120px-Surrey_County_Cricket_1_Club.svg.png",                         color: "#1c4f9c", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.lancashire",      name: "Lancashire",     shortName: "Lancashire",   abbr: "LAN", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/72/Lancashire_County_Cricket_Club_logo.svg/120px-Lancashire_County_Cricket_Club_logo.svg.png",           color: "#e50000", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.essex",           name: "Essex",          shortName: "Essex",        abbr: "ESS", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/ef/EssexCountyCricketLogo2023.svg/120px-EssexCountyCricketLogo2023.svg.png",                             color: "#e50000", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.kent",            name: "Kent",           shortName: "Kent",         abbr: "KEN", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/23/KentCCCLogo.svg/120px-KentCCCLogo.svg.png",                                                           color: "#b01c2e", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.warwickshire",    name: "Warwickshire",   shortName: "Warwickshire", abbr: "WAR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/25/Warwickshire_County_Cricket_Club_logo.svg/120px-Warwickshire_County_Cricket_Club_logo.svg.png",       color: "#003087", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.nottinghamshire", name: "Nottinghamshire",shortName: "Notts",        abbr: "NOT", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9f/NottinghamshireCountyCricketClubLogo.svg/120px-NottinghamshireCountyCricketClubLogo.svg.png",         color: "#d4a017", leagueId: "eng.domestic", leagueName: "County Championship" },
  { id: "cc.hampshire",       name: "Hampshire",      shortName: "Hampshire",    abbr: "HAM", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9a/Hampshire_CCC_logo.svg/120px-Hampshire_CCC_logo.svg.png",                                             color: "#003087", leagueId: "eng.domestic", leagueName: "County Championship" },
];

// ─── ILT20 (International League T20 — UAE/Dubai) ────────────────────────────
const ILT20: CricketTeam[] = [
  { id: "ilt20.adkr",  name: "Abu Dhabi Knight Riders", shortName: "Abu Dhabi KR",    abbr: "ADKR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/e/e2/AbuDhabiKnightRiders_Logo.svg/120px-AbuDhabiKnightRiders_Logo.svg.png",  color: "#3a225d", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.dv",    name: "Desert Vipers",           shortName: "Desert Vipers",   abbr: "DV",   logo: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Desert_Vipers.png",                                                       color: "#1a5c2a", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.dc",    name: "Dubai Capitals",          shortName: "Dubai Capitals",  abbr: "DC",   logo: "https://upload.wikimedia.org/wikipedia/commons/8/8f/Dubai_Capital.png",                                                       color: "#004ba0", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.gg",    name: "Gulf Giants",             shortName: "Gulf Giants",     abbr: "GG",   logo: "https://upload.wikimedia.org/wikipedia/en/thumb/8/8a/Gulf_Giants_Logo.svg/120px-Gulf_Giants_Logo.svg.png",                    color: "#8b0000", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.mie",   name: "MI Emirates",             shortName: "MI Emirates",     abbr: "MIE",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d4/MI_Emirates_%E2%80%93_Logo.svg/120px-MI_Emirates_%E2%80%93_Logo.svg.png", color: "#004ba0", leagueId: "ilt20", leagueName: "Int'l League T20" },
  { id: "ilt20.sw",    name: "Sharjah Warriors",        shortName: "Sharjah Warriors",abbr: "SW",   logo: "https://upload.wikimedia.org/wikipedia/en/5/57/Sharjah_Warriors_Logo.png",                                                    color: "#c8a000", leagueId: "ilt20", leagueName: "Int'l League T20" },
];

// ─── Major League Cricket (USA) ───────────────────────────────────────────────
const MLC: CricketTeam[] = [
  { id: "mlc.miny",    name: "MI New York",            shortName: "MI New York",   abbr: "MINY", logo: "https://upload.wikimedia.org/wikipedia/en/2/2c/MI_New_York_logo.png",                                                                                                color: "#004ba0", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.sea",     name: "Seattle Orcas",          shortName: "Seattle Orcas", abbr: "SEA",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/1/1f/Seattle_Orcas_Logo.svg/120px-Seattle_Orcas_Logo.svg.png",                                                       color: "#00704a", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.tsk",     name: "Texas Super Kings",      shortName: "Texas SKs",     abbr: "TSK",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/23/Texas_Super_Kings_Logo.svg/120px-Texas_Super_Kings_Logo.svg.png",                                                 color: "#fdb913", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.sfu",     name: "San Francisco Unicorns", shortName: "SF Unicorns",   abbr: "SFU",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/f/f4/San_Francisco_Unicorns_Logo_official.svg/120px-San_Francisco_Unicorns_Logo_official.svg.png",                     color: "#6a0dad", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.waf",     name: "Washington Freedom",     shortName: "Washington F",  abbr: "WAF",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/db/Washington_Freedom_Logo.svg/120px-Washington_Freedom_Logo.svg.png",                                              color: "#c8102e", leagueId: "mlc", leagueName: "Major League Cricket" },
  { id: "mlc.lakr",    name: "LA Knight Riders",       shortName: "LA Knight Rs",  abbr: "LAKR", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/3/39/Los_Angeles_Knight_Riders_official_logo.svg/120px-Los_Angeles_Knight_Riders_official_logo.svg.png",               color: "#3a225d", leagueId: "mlc", leagueName: "Major League Cricket" },
];

// ─── Lanka Premier League (Sri Lanka) ────────────────────────────────────────
// ESPNcricinfo CDN — img1.hscicdn.com (verified 200 OK)
const LPL: CricketTeam[] = [
  { id: "lpl.cs",      name: "Colombo Strikers",  shortName: "Colombo Str",   abbr: "CS",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/417700/417703.png", color: "#003087", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.dt",      name: "Dambulla Thunders", shortName: "Dambulla Thun", abbr: "DT",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/417700/417704.png", color: "#004d00", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.gm",      name: "Galle Marvels",     shortName: "Galle Marvels", abbr: "GM",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/417700/417705.png", color: "#00704a", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.jk",      name: "Jaffna Kings",      shortName: "Jaffna Kings",  abbr: "JK",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/417700/417706.png", color: "#fdb913", leagueId: "lpl", leagueName: "Lanka Premier League" },
  { id: "lpl.kf",      name: "Kandy Falcons",     shortName: "Kandy Falcons", abbr: "KF",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/417700/417707.png", color: "#c8102e", leagueId: "lpl", leagueName: "Lanka Premier League" },
];

// ─── Bangladesh Premier League ────────────────────────────────────────────────
const BPL: CricketTeam[] = [
  { id: "bpl.comilla",   name: "Comilla Victorians", shortName: "Comilla Vic",  abbr: "CV",  logo: "https://upload.wikimedia.org/wikipedia/commons/9/93/Comilla_Victorians.png",                                                     color: "#003087", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.dhaka",     name: "Dhaka Dominators",   shortName: "Dhaka Dom",    abbr: "DD",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/a/a4/Logo_of_Dhaka_Capitals.svg/120px-Logo_of_Dhaka_Capitals.svg.png",           color: "#c8102e", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.sylhet",    name: "Sylhet Strikers",    shortName: "Sylhet Str",   abbr: "SS",  logo: "https://upload.wikimedia.org/wikipedia/en/4/43/Sylhet_Titans_logo.jpg",                                                          color: "#006400", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.chittagong",name: "Chittagong Kings",   shortName: "Chitt Kings",  abbr: "CK",  logo: "https://upload.wikimedia.org/wikipedia/en/b/b8/Chattogram_Royals_logo.png",                                                      color: "#fdb913", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.fortune",   name: "Fortune Barishal",   shortName: "Fortune Bar",  abbr: "FB",  logo: "https://upload.wikimedia.org/wikipedia/en/e/ea/Fortune_Barishal.png",                                                            color: "#6a0dad", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
  { id: "bpl.rangpur",   name: "Rangpur Riders",     shortName: "Rangpur Ride", abbr: "RR",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/2e/Rangpur_Riders_logo.svg/120px-Rangpur_Riders_logo.svg.png",                 color: "#e65100", leagueId: "bpl", leagueName: "Bangladesh Premier Lge" },
];

// ─── GT20 Canada ──────────────────────────────────────────────────────────────
// ESPNcricinfo CDN — img1.hscicdn.com (verified 200 OK)
const GT20: CricketTeam[] = [
  { id: "gt20.bangla",    name: "Bangla Tigers Mississauga", shortName: "Bangla Tigers", abbr: "BTM", logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/385400/385456.png",      color: "#006a4e", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.brampton",  name: "Brampton Wolves",          shortName: "Brampton Wlvs", abbr: "BW",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/363900/363942.png",      color: "#003087", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.montreal",  name: "Montreal Tigers",          shortName: "Montreal Tgrs", abbr: "MT",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/313500/313563.logo.png", color: "#e50000", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.surrey",    name: "Surrey Jaguars",           shortName: "Surrey Jaguars",abbr: "SJ",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/363900/363940.png",      color: "#1c4f9c", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.toronto",   name: "Toronto Nationals",        shortName: "Toronto Nat",   abbr: "TN",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/313500/313561.logo.png", color: "#d4a017", leagueId: "gt20", leagueName: "GT20 Canada" },
  { id: "gt20.vancouver", name: "Vancouver Knights",        shortName: "Vancouver Kng", abbr: "VK",  logo: "https://img1.hscicdn.com/image/upload/f_auto,t_ds_square_w_160,q_50/lsci/db/PICTURES/CMS/313500/313562.logo.png", color: "#00704a", leagueId: "gt20", leagueName: "GT20 Canada" },
];

// ─── Sheffield Shield (Australia domestic) ───────────────────────────────────
const SHEFFIELD_SHIELD: CricketTeam[] = [
  { id: "ss.nsw",  name: "New South Wales Blues",     shortName: "NSW Blues",      abbr: "NSW",  logo: "https://upload.wikimedia.org/wikipedia/en/7/7c/NSW_Men%27s_cricket_team_logo.png",                                      color: "#003087", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.vic",  name: "Victoria Bushrangers",      shortName: "VIC Bushrangers",abbr: "VIC",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/45/VictoriaCricketTeamLogo.svg/120px-VictoriaCricketTeamLogo.svg.png", color: "#002664", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.qld",  name: "Queensland Bulls",          shortName: "QLD Bulls",      abbr: "QLD",  logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/29/QueenslandBullsLogo.svg/120px-QueenslandBullsLogo.svg.png",          color: "#c8102e", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.sa",   name: "South Australia Redbacks",  shortName: "SA Redbacks",    abbr: "SA",   logo: "https://upload.wikimedia.org/wikipedia/en/0/09/South_Australia_Cricket_Team_Logo.webp",                                  color: "#e50000", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.wa",   name: "Western Australia Warriors",shortName: "WA Warriors",    abbr: "WA",   logo: "https://upload.wikimedia.org/wikipedia/en/5/50/Western_Warriors_logo.png",                                               color: "#fdb913", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
  { id: "ss.tas",  name: "Tasmania Tigers",           shortName: "Tasmania Tgrs",  abbr: "TAS",  logo: "https://upload.wikimedia.org/wikipedia/en/c/c1/Tasmaniancricketteamlogo.png",                                            color: "#ff8c00", leagueId: "aus.domestic", leagueName: "Sheffield Shield" },
];

// ─── Plunket Shield (New Zealand domestic) ───────────────────────────────────
const PLUNKET_SHIELD: CricketTeam[] = [
  { id: "nz.auckland",     name: "Auckland Aces",        shortName: "Auckland Aces",  abbr: "AKL", logo: "https://upload.wikimedia.org/wikipedia/en/3/3f/Auckland_cricket_team_logo.png",    color: "#003087", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.wellington",   name: "Wellington Firebirds", shortName: "Wellington FB",  abbr: "WGN", logo: "https://upload.wikimedia.org/wikipedia/en/1/13/Wellington_Firebirds_logo.png",     color: "#ff6a00", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.canterbury",   name: "Canterbury Kings",     shortName: "Canterbury Kgs", abbr: "CAN", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/2/24/CanterburyCricket.png/120px-CanterburyCricket.png",                  color: "#c8102e", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.otago",        name: "Otago Volts",          shortName: "Otago Volts",    abbr: "OTG", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/9/9d/Otago_cricket.png/120px-Otago_cricket.png",                          color: "#fdb913", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.centraldistr", name: "Central Districts",    shortName: "Central Dists",  abbr: "CD",  logo: "https://upload.wikimedia.org/wikipedia/en/9/91/Central_Stags_logo_transparent.png",                                       color: "#006400", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
  { id: "nz.northernknts", name: "Northern Knights",     shortName: "Northern Knts",  abbr: "ND",  logo: "https://upload.wikimedia.org/wikipedia/en/3/36/Northern_Knights_%28cricket_team%29_logo.png",                             color: "#003087", leagueId: "nz.domestic", leagueName: "Plunket Shield" },
];

// ─── All National Teams (for WTC, Tests, ICC events) ─────────────────────────
const NATIONAL_TEAMS: CricketTeam[] = [
  { id: "nat.ind", name: "India",        shortName: "India",        abbr: "IND", logo: "https://upload.wikimedia.org/wikipedia/en/8/8d/Cricket_India_Crest.svg",             color: "#003087", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.aus", name: "Australia",    shortName: "Australia",    abbr: "AUS", logo: "https://upload.wikimedia.org/wikipedia/en/a/a4/Cricket_Australia.svg",               color: "#f5a800", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.eng", name: "England",      shortName: "England",      abbr: "ENG", logo: "https://upload.wikimedia.org/wikipedia/en/9/9d/England_Cricket.svg",                 color: "#002664", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.pak", name: "Pakistan",     shortName: "Pakistan",     abbr: "PAK", logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/PCB_Official_Logo.svg",               color: "#006400", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.sa",  name: "South Africa", shortName: "South Africa", abbr: "SA",  logo: "https://upload.wikimedia.org/wikipedia/en/a/a1/Cricket_South_Africa_logo.png",       color: "#007a4d", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.nz",  name: "New Zealand",  shortName: "New Zealand",  abbr: "NZ",  logo: "https://upload.wikimedia.org/wikipedia/en/c/c3/New_Zealand_Cricket_Logo.svg",        color: "#000000", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.wi",  name: "West Indies",  shortName: "West Indies",  abbr: "WI",  logo: "https://upload.wikimedia.org/wikipedia/en/9/9e/West_Indies_Cricket_Board_Logo.svg",  color: "#7b0000", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.sl",  name: "Sri Lanka",    shortName: "Sri Lanka",    abbr: "SL",  logo: "https://upload.wikimedia.org/wikipedia/en/3/3b/Sri_Lanka_Cricket_logo.png",          color: "#003087", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.ban", name: "Bangladesh",   shortName: "Bangladesh",   abbr: "BAN", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/5/5c/Bangladesh_Cricket_Board_Logo.svg/120px-Bangladesh_Cricket_Board_Logo.svg.png",   color: "#006a4e", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.afg", name: "Afghanistan",  shortName: "Afghanistan",  abbr: "AFG", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Afghanistan_cricket_board_logo.jpg/120px-Afghanistan_cricket_board_logo.jpg",  color: "#003087", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.zim", name: "Zimbabwe",     shortName: "Zimbabwe",     abbr: "ZIM", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/4/48/Zimbabwe_Cricket_%28logo%29.svg/120px-Zimbabwe_Cricket_%28logo%29.svg.png",           color: "#006400", leagueId: "icc.wtc",   leagueName: "World Test Championship" },
  { id: "nat.ire", name: "Ireland",      shortName: "Ireland",      abbr: "IRE", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/0/0c/Ireland_cricket_logo.svg/120px-Ireland_cricket_logo.svg.png",                        color: "#009a44", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.ned", name: "Netherlands",  shortName: "Netherlands",  abbr: "NED", logo: "https://upload.wikimedia.org/wikipedia/en/8/86/Logo_of_cricket_Netherlands.png",                                                          color: "#ff6700", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.sco", name: "Scotland",     shortName: "Scotland",     abbr: "SCO", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/6/64/ScotlandMenCricketLogo.svg/120px-ScotlandMenCricketLogo.svg.png",                    color: "#003399", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.uga", name: "Uganda",       shortName: "Uganda",       abbr: "UGA", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/72/Uganda_Cricket_Association_logo.png/120px-Uganda_Cricket_Association_logo.png", color: "#000000", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.usa", name: "USA",          shortName: "USA",          abbr: "USA", logo: "https://upload.wikimedia.org/wikipedia/en/thumb/7/7e/USA_Cricket_logo.svg/120px-USA_Cricket_logo.svg.png",                               color: "#002868", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.png", name: "Papua New Guinea",shortName: "PNG",       abbr: "PNG", logo: "https://upload.wikimedia.org/wikipedia/en/c/c6/Cricket_PNG_logo.png",                                                                     color: "#000000", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.nam", name: "Namibia",      shortName: "Namibia",      abbr: "NAM", logo: "https://upload.wikimedia.org/wikipedia/en/2/29/Logo_of_Namibia_Cricket_2021.png",                                                        color: "#003087", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.can", name: "Canada",       shortName: "Canada",       abbr: "CAN", logo: "https://upload.wikimedia.org/wikipedia/en/7/74/CricketCanada.png",                                                                        color: "#c8102e", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
  { id: "nat.oman",name: "Oman",         shortName: "Oman",         abbr: "OMA", logo: "https://upload.wikimedia.org/wikipedia/en/6/63/Logo_of_Oman_Cricket.png",                                                                 color: "#db161b", leagueId: "icc.t20wc", leagueName: "ICC T20 World Cup" },
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
