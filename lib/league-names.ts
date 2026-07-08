import type { Locale } from "./i18n";

/**
 * League and competition name translations.
 * Keyed by ESPN English name or common variants.
 */
const LEAGUE_NAMES: Record<string, Partial<Record<Locale, string>>> = {
  // FIFA
  "FIFA World Cup":              { ar: "كأس العالم", hi: "फीफा विश्व कप", es: "Copa Mundial FIFA", fr: "Coupe du Monde FIFA", pt: "Copa do Mundo FIFA" },
  "FIFA World Cup Qualifying":   { ar: "تصفيات كأس العالم", hi: "फीफा विश्व कप क्वालीफाइंग", es: "Clasificación Mundial", fr: "Qualifications Coupe du Monde", pt: "Eliminatórias da Copa" },
  "FIFA Women's World Cup":      { ar: "كأس العالم للسيدات", hi: "फीफा महिला विश्व कप", es: "Copa Mundial Femenina", fr: "Coupe du Monde Féminine", pt: "Copa do Mundo Feminina" },
  "FIFA Club World Cup":         { ar: "كأس العالم للأندية", hi: "फीफा क्लब विश्व कप", es: "Mundial de Clubes", fr: "Coupe du Monde des Clubs", pt: "Mundial de Clubes" },
  "FIFA U-20 World Cup":         { ar: "كأس العالم تحت 20 سنة", hi: "फीफा U-20 विश्व कप", es: "Mundial Sub-20", fr: "Coupe du Monde U-20", pt: "Copa do Mundo Sub-20" },
  // UEFA
  "UEFA Champions League":       { ar: "دوري أبطال أوروبا", hi: "यूईएफए चैंपियंस लीग", es: "Liga de Campeones", fr: "Ligue des Champions", pt: "Liga dos Campeões" },
  "Champions League":            { ar: "دوري أبطال أوروبا", hi: "चैंपियंस लीग", es: "Liga de Campeones", fr: "Ligue des Champions", pt: "Liga dos Campeões" },
  "UEFA Europa League":          { ar: "الدوري الأوروبي", hi: "यूरोपा लीग", es: "Europa League", fr: "Ligue Europa", pt: "Liga Europa" },
  "Europa League":               { ar: "الدوري الأوروبي", hi: "यूरोपा लीग", es: "Europa League", fr: "Ligue Europa", pt: "Liga Europa" },
  "UEFA Europa Conference League": { ar: "دوري المؤتمر الأوروبي", hi: "यूरोपा कॉन्फ्रेंस लीग", es: "Conference League", fr: "Ligue Europa Conférence", pt: "Liga Conferência" },
  "UEFA Euro":                   { ar: "بطولة أمم أوروبا", hi: "यूईएफए यूरो", es: "Eurocopa", fr: "Championnat d'Europe", pt: "Eurocopa" },
  "Euro":                        { ar: "يورو", hi: "यूरो", es: "Eurocopa", fr: "Euro", pt: "Euro" },
  "UEFA Nations League":         { ar: "دوري الأمم الأوروبية", hi: "यूईएफए नेशंस लीग", es: "Liga de Naciones", fr: "Ligue des Nations", pt: "Liga das Nações" },
  "UEFA Super Cup":              { ar: "كأس السوبر الأوروبي", hi: "यूईएफए सुपर कप", es: "Supercopa de Europa", fr: "Supercoupe d'Europe", pt: "Supercopa da UEFA" },
  // England
  "English Premier League":      { ar: "الدوري الإنجليزي الممتاز", hi: "इंग्लिश प्रीमियर लीग", es: "Premier League", fr: "Premier League", pt: "Premier League" },
  "Premier League":              { ar: "الدوري الإنجليزي الممتاز", hi: "प्रीमियर लीग", es: "Premier League", fr: "Premier League", pt: "Premier League" },
  "FA Cup":                      { ar: "كأس الاتحاد الإنجليزي", hi: "एफए कप", es: "Copa FA", fr: "Coupe d'Angleterre", pt: "Copa da Inglaterra" },
  "EFL Cup":                     { ar: "كأس رابطة الأندية", hi: "ईएफएल कप", es: "Copa de la Liga", fr: "Coupe de la Ligue", pt: "Copa da Liga" },
  "EFL Championship":            { ar: "دوري البطولة الإنجليزي", hi: "ईएफएल चैंपियनशिप", es: "Championship", fr: "Championship", pt: "Championship" },
  "Community Shield":            { ar: "درع المجتمع", hi: "कम्युनिटी शील्ड", es: "Community Shield", fr: "Community Shield", pt: "Community Shield" },
  // Spain
  "Spanish La Liga":             { ar: "الدوري الإسباني", hi: "ला लीगा", es: "La Liga", fr: "La Liga", pt: "La Liga" },
  "La Liga":                     { ar: "الدوري الإسباني", hi: "ला लीगा", es: "La Liga", fr: "La Liga", pt: "La Liga" },
  "Copa del Rey":                { ar: "كأس ملك إسبانيا", hi: "कोपा डेल रे", es: "Copa del Rey", fr: "Coupe du Roi", pt: "Copa do Rei" },
  "Spanish Supercopa":           { ar: "كأس السوبر الإسباني", hi: "स्पैनिश सुपरकोपा", es: "Supercopa de España", fr: "Supercoupe d'Espagne", pt: "Supercopa da Espanha" },
  // Germany
  "German Bundesliga":           { ar: "الدوري الألماني", hi: "बुंडेसलीगा", es: "Bundesliga", fr: "Bundesliga", pt: "Bundesliga" },
  "Bundesliga":                  { ar: "الدوري الألماني", hi: "बुंडेसलीगा", es: "Bundesliga", fr: "Bundesliga", pt: "Bundesliga" },
  "DFB-Pokal":                   { ar: "كأس ألمانيا", hi: "डीएफबी पोकल", es: "Copa de Alemania", fr: "Coupe d'Allemagne", pt: "Copa da Alemanha" },
  // Italy
  "Italian Serie A":             { ar: "الدوري الإيطالي", hi: "सीरी ए", es: "Serie A", fr: "Serie A", pt: "Serie A" },
  "Serie A":                     { ar: "الدوري الإيطالي", hi: "सीरी ए", es: "Serie A", fr: "Serie A", pt: "Serie A" },
  "Coppa Italia":                { ar: "كأس إيطاليا", hi: "कोप्पा इटालिया", es: "Copa de Italia", fr: "Coupe d'Italie", pt: "Copa da Itália" },
  // France
  "French Ligue 1":              { ar: "الدوري الفرنسي", hi: "लीग 1", es: "Ligue 1", fr: "Ligue 1", pt: "Ligue 1" },
  "Ligue 1":                     { ar: "الدوري الفرنسي", hi: "लीग 1", es: "Ligue 1", fr: "Ligue 1", pt: "Ligue 1" },
  "Coupe de France":             { ar: "كأس فرنسا", hi: "कूप दे फ्रांस", es: "Copa de Francia", fr: "Coupe de France", pt: "Copa da França" },
  // South America
  "Copa América":                { ar: "كوبا أمريكا", hi: "कोपा अमेरिका", es: "Copa América", fr: "Copa América", pt: "Copa América" },
  "Copa America":                { ar: "كوبا أمريكا", hi: "कोपा अमेरिका", es: "Copa América", fr: "Copa América", pt: "Copa América" },
  "Copa Libertadores":           { ar: "كوبا ليبرتادوريس", hi: "कोपा लिबर्टाडोरेस", es: "Copa Libertadores", fr: "Copa Libertadores", pt: "Copa Libertadores" },
  "Copa Sudamericana":           { ar: "كوبا سود أمريكانا", hi: "कोपा सुदामेरिकाना", es: "Copa Sudamericana", fr: "Copa Sudamericana", pt: "Copa Sul-Americana" },
  "Brazilian Serie A":           { ar: "الدوري البرازيلي", hi: "ब्राज़ीलियन सीरी ए", es: "Brasileirão", fr: "Brasileirão", pt: "Brasileirão" },
  "Argentine Liga Profesional":  { ar: "الدوري الأرجنتيني", hi: "अर्जेंटीना लीगा प्रोफेशनल", es: "Liga Profesional", fr: "Liga Profesional", pt: "Liga Profissional Argentina" },
  // Africa
  "Africa Cup of Nations":       { ar: "كأس أمم أفريقيا", hi: "अफ्रीका कप ऑफ नेशंस", es: "Copa Africana de Naciones", fr: "Coupe d'Afrique des Nations", pt: "Copa Africana de Nações" },
  "CAF Champions League":        { ar: "دوري أبطال أفريقيا", hi: "सीएएफ चैंपियंस लीग", es: "Liga de Campeones de la CAF", fr: "Ligue des Champions de la CAF", pt: "Liga dos Campeões da CAF" },
  // Asia
  "AFC Champions League":        { ar: "دوري أبطال آسيا", hi: "एएफसी चैंपियंस लीग", es: "Liga de Campeones de la AFC", fr: "Ligue des Champions de l'AFC", pt: "Liga dos Campeões da AFC" },
  "Asian Cup":                   { ar: "كأس آسيا", hi: "एशियन कप", es: "Copa Asiática", fr: "Coupe d'Asie", pt: "Copa da Ásia" },
  // North America
  "CONCACAF Gold Cup":           { ar: "الكأس الذهبية", hi: "कॉनकैकैफ गोल्ड कप", es: "Copa Oro", fr: "Gold Cup", pt: "Copa Ouro" },
  "CONCACAF Nations League":     { ar: "دوري أمم الكونكاكاف", hi: "कॉनकैकैफ नेशंस लीग", es: "Liga de Naciones CONCACAF", fr: "Ligue des Nations CONCACAF", pt: "Liga das Nações CONCACAF" },
  "MLS":                         { ar: "الدوري الأمريكي", hi: "एमएलएस", es: "MLS", fr: "MLS", pt: "MLS" },
  "Liga MX":                     { ar: "الدوري المكسيكي", hi: "लीगा MX", es: "Liga MX", fr: "Liga MX", pt: "Liga MX" },
  // Cricket
  "Indian Premier League":       { ar: "الدوري الهندي الممتاز", hi: "इंडियन प्रीमियर लीग", es: "Indian Premier League", fr: "Indian Premier League", pt: "Indian Premier League" },
  "IPL":                         { ar: "الدوري الهندي الممتاز", hi: "आईपीएल", es: "IPL", fr: "IPL", pt: "IPL" },
  "ICC Cricket World Cup":       { ar: "كأس العالم للكريكت", hi: "आईसीसी क्रिकेट विश्व कप", es: "Copa Mundial de Críquet", fr: "Coupe du Monde de Cricket", pt: "Copa do Mundo de Críquete" },
  "ICC Champions Trophy":        { ar: "كأس أبطال الكريكت", hi: "आईसीसी चैंपियंस ट्रॉफी", es: "Trofeo de Campeones ICC", fr: "Trophée des Champions ICC", pt: "Troféu dos Campeões ICC" },
  "The Ashes":                   { ar: "سلسلة الآشز", hi: "द एशेज", es: "The Ashes", fr: "The Ashes", pt: "The Ashes" },
  "T20 World Cup":               { ar: "كأس العالم للتوينتي", hi: "टी20 विश्व कप", es: "Copa Mundial T20", fr: "Coupe du Monde T20", pt: "Copa do Mundo T20" },
  // Basketball
  "NBA":                         { ar: "الدوري الأمريكي للمحترفين", hi: "एनबीए", es: "NBA", fr: "NBA", pt: "NBA" },
  "NBA Playoffs":                { ar: "تصفيات NBA", hi: "एनबीए प्लेऑफ", es: "Playoffs NBA", fr: "Playoffs NBA", pt: "Playoffs da NBA" },
  "NBA Finals":                  { ar: "نهائيات NBA", hi: "एनबीए फाइनल्स", es: "Finales NBA", fr: "Finales NBA", pt: "Finais da NBA" },
  "WNBA":                        { ar: "الدوري النسائي للمحترفات", hi: "डब्ल्यूएनबीए", es: "WNBA", fr: "WNBA", pt: "WNBA" },
  "EuroLeague":                  { ar: "الدوري الأوروبي لكرة السلة", hi: "यूरोलीग", es: "Euroliga", fr: "Euroligue", pt: "Euroliga" },
  // F1
  "Formula 1":                   { ar: "فورمولا 1", hi: "फॉर्मूला 1", es: "Fórmula 1", fr: "Formule 1", pt: "Fórmula 1" },
  "F1":                          { ar: "فورمولا 1", hi: "फॉर्मूला 1", es: "F1", fr: "F1", pt: "F1" },
  // NFL
  "NFL":                         { ar: "دوري كرة القدم الأمريكية", hi: "एनएफएल", es: "NFL", fr: "NFL", pt: "NFL" },
  "Super Bowl":                  { ar: "السوبر بول", hi: "सुपर बाउल", es: "Super Bowl", fr: "Super Bowl", pt: "Super Bowl" },
  // Tennis
  "Wimbledon":                   { ar: "ويمبلدون", hi: "विंबलडन", es: "Wimbledon", fr: "Wimbledon", pt: "Wimbledon" },
  "Australian Open":             { ar: "بطولة أستراليا المفتوحة", hi: "ऑस्ट्रेलियन ओपन", es: "Abierto de Australia", fr: "Open d'Australie", pt: "Aberto da Austrália" },
  "French Open":                 { ar: "بطولة فرنسا المفتوحة", hi: "फ्रेंच ओपन", es: "Roland Garros", fr: "Roland-Garros", pt: "Roland Garros" },
  "US Open":                     { ar: "بطولة أمريكا المفتوحة", hi: "यूएस ओपन", es: "Abierto de EE.UU.", fr: "US Open", pt: "US Open" },
  // Other
  "Friendly":                    { ar: "ودية", hi: "मैत्री मैच", es: "Amistoso", fr: "Amical", pt: "Amistoso" },
  "Friendlies":                  { ar: "مباريات ودية", hi: "मैत्री मैच", es: "Amistosos", fr: "Amicaux", pt: "Amistosos" },
  "International Friendly":      { ar: "ودية دولية", hi: "अंतर्राष्ट्रीय मैत्री मैच", es: "Amistoso Internacional", fr: "Amical International", pt: "Amistoso Internacional" },
  "Club Friendly":               { ar: "ودية أندية", hi: "क्लब मैत्री मैच", es: "Amistoso de Clubes", fr: "Amical de Clubs", pt: "Amistoso de Clubes" },
};

/**
 * Translate a league name. Tries exact match first, then substring match.
 */
export function translateLeagueName(englishName: string, locale: Locale): string {
  if (locale === "en") return englishName;
  // Exact match
  const exact = LEAGUE_NAMES[englishName]?.[locale];
  if (exact) return exact;
  // Substring match: find the longest key that the name contains
  let best = "";
  let bestLen = 0;
  for (const key of Object.keys(LEAGUE_NAMES)) {
    if (englishName.includes(key) && key.length > bestLen && LEAGUE_NAMES[key]?.[locale]) {
      best = LEAGUE_NAMES[key][locale]!;
      bestLen = key.length;
    }
  }
  return best || englishName;
}
