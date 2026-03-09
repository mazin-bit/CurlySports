// @ts-nocheck

// Map internal player IDs to verified ESPN soccer player IDs for headshots
// ONLY includes IDs verified via ESPN.com searches and squad pages
export const SOCCER_ESPN_IDS = {
  // TOP STARS (all verified)
  45843: 45843,     // Messi
  22712: 22774,     // Cristiano Ronaldo
  129596: 132948,   // Neymar Jr
  210513: 253989,   // Erling Haaland
  238861: 252107,   // Vinícius Júnior
  270438: 291281,   // Jude Bellingham
  491564: 362150,   // Lamine Yamal
  126131: 125824,   // Robert Lewandowski
  159665: 173896,   // Mohamed Salah
  158500: 142200,   // Harry Kane
  423549: 250465,   // Pedri
  139867: 134947,   // Kevin De Bruyne
  231908: 231828,   // Rodri
  227181: 203669,   // Martin Ødegaard
  140019: 140416,   // Antoine Griezmann
  391585: 219713,   // Lautaro Martínez
  391857: 228296,   // Victor Osimhen
  444222: 303748,   // Florian Wirtz
  410313: 303821,   // Jamal Musiala
  139871: 157892,   // Virgil van Dijk
  253919: 238262,   // Declan Rice
  424911: 296395,   // Cole Palmer
  403164: 280555,   // Bukayo Saka
  238864: 250787,   // Phil Foden
  186001: 190161,   // Joshua Kimmich
  104230: 84774,    // Manuel Neuer
  139870: 134283,   // Thibaut Courtois
  175654: 196876,   // Alisson
  191695: 199833,   // Bernardo Silva
  233775: 234878,   // Rúben Dias
  211019: 176948,   // Ederson
  // From Real Madrid squad page
  394391: 228402,   // Éder Militão
  161986: 169438,   // Antonio Rüdiger
  254246: 235818,   // Federico Valverde
  238873: 265919,   // Aurélien Tchouaméni
  // From Arsenal squad page
  423546: 277385,   // William Saliba
  238865: 217289,   // Gabriel Jesus
  238927: 231182,   // Kai Havertz
  // Other verified
  225954: 217092,   // Gianluigi Donnarumma
  394393: 236721,   // Alphonso Davies
  181820: 140740,   // Marc-André ter Stegen
  238863: 235662,   // Alexander Isak
  394392: 258917,   // Rafael Leão
  233777: 204441,   // Nicolò Barella
  225964: 225607,   // Christian Pulisic
  133201: 159248,   // Nathan Aké
  403138: 271788,   // Darwin Núñez
  254245: 208133,   // Diogo Jota
  391158: 257390,   // Luis Díaz
  247291: 285450,   // Enzo Fernández
  403250: 274745,   // Khvicha Kvaratskhelia
  173513: 159047,   // Marquinhos
  126132: 88965,    // Olivier Giroud
  104223: 76762,    // Luka Modrić
  104258: 123465,   // Thomas Müller
  194321: 227765,   // Dani Olmo
};

export const getHeadshot = (id) => {
  const espnId = SOCCER_ESPN_IDS[id] || id;
  return `https://a.espncdn.com/combiner/i?img=/i/headshots/soccer/players/full/${espnId}.png&w=350&h=254`;
};
export const getNBAHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/nba/players/full/${id}.png&w=350&h=254`;
export const getNFLHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/nfl/players/full/${id}.png&w=350&h=254`;
export const getMLBHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/mlb/players/full/${id}.png&w=350&h=254`;
export const getNHLHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/nhl/players/full/${id}.png&w=350&h=254`;
export const getCricketHeadshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/cricket/players/full/${id}.png&w=350&h=254`;
export const getF1Headshot = (id) => `https://a.espncdn.com/combiner/i?img=/i/headshots/rpm/players/full/${id}.png&w=350&h=254`;

export const SPORT_HEADSHOT_FN = {
  soccer: getHeadshot,
  basketball: getNBAHeadshot,
  football: getNFLHeadshot,
  baseball: getMLBHeadshot,
  hockey: getNHLHeadshot,
  cricket: getCricketHeadshot,
  f1: getF1Headshot
};
