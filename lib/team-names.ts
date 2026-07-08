import type { Locale } from "./i18n";

/**
 * National team name translations.
 * Club names (Man Utd, Barcelona, etc.) are proper nouns — stay untranslated.
 * Keyed by ESPN English displayName.
 */
const TEAM_NAMES: Record<string, Partial<Record<Locale, string>>> = {
  // A
  "Afghanistan":      { ar: "أفغانستان", hi: "अफ़ग़ानिस्तान", es: "Afganistán", fr: "Afghanistan", pt: "Afeganistão" },
  "Albania":          { ar: "ألبانيا", hi: "अल्बानिया", es: "Albania", fr: "Albanie", pt: "Albânia" },
  "Algeria":          { ar: "الجزائر", hi: "अल्जीरिया", es: "Argelia", fr: "Algérie", pt: "Argélia" },
  "Angola":           { ar: "أنغولا", hi: "अंगोला", es: "Angola", fr: "Angola", pt: "Angola" },
  "Argentina":        { ar: "الأرجنتين", hi: "अर्जेंटीना", es: "Argentina", fr: "Argentine", pt: "Argentina" },
  "Australia":        { ar: "أستراليا", hi: "ऑस्ट्रेलिया", es: "Australia", fr: "Australie", pt: "Austrália" },
  "Austria":          { ar: "النمسا", hi: "ऑस्ट्रिया", es: "Austria", fr: "Autriche", pt: "Áustria" },
  // B
  "Bahrain":          { ar: "البحرين", hi: "बहरीन", es: "Baréin", fr: "Bahreïn", pt: "Barém" },
  "Bangladesh":       { ar: "بنغلاديش", hi: "बांग्लादेश", es: "Bangladés", fr: "Bangladesh", pt: "Bangladesh" },
  "Belgium":          { ar: "بلجيكا", hi: "बेल्जियम", es: "Bélgica", fr: "Belgique", pt: "Bélgica" },
  "Bolivia":          { ar: "بوليفيا", hi: "बोलीविया", es: "Bolivia", fr: "Bolivie", pt: "Bolívia" },
  "Bosnia-Herzegovina": { ar: "البوسنة والهرسك", hi: "बोस्निया और हर्ज़ेगोविना", es: "Bosnia y Herzegovina", fr: "Bosnie-Herzégovine", pt: "Bósnia e Herzegovina" },
  "Bosnia And Herzegovina": { ar: "البوسنة والهرسك", hi: "बोस्निया और हर्ज़ेगोविना", es: "Bosnia y Herzegovina", fr: "Bosnie-Herzégovine", pt: "Bósnia e Herzegovina" },
  "Brazil":           { ar: "البرازيل", hi: "ब्राज़ील", es: "Brasil", fr: "Brésil", pt: "Brasil" },
  "Bulgaria":         { ar: "بلغاريا", hi: "बुल्गारिया", es: "Bulgaria", fr: "Bulgarie", pt: "Bulgária" },
  "Burkina Faso":     { ar: "بوركينا فاسو", hi: "बुर्किना फ़ासो", es: "Burkina Faso", fr: "Burkina Faso", pt: "Burkina Faso" },
  // C
  "Cameroon":         { ar: "الكاميرون", hi: "कैमरून", es: "Camerún", fr: "Cameroun", pt: "Camarões" },
  "Canada":           { ar: "كندا", hi: "कनाडा", es: "Canadá", fr: "Canada", pt: "Canadá" },
  "Chile":            { ar: "تشيلي", hi: "चिली", es: "Chile", fr: "Chili", pt: "Chile" },
  "China":            { ar: "الصين", hi: "चीन", es: "China", fr: "Chine", pt: "China" },
  "China PR":         { ar: "الصين", hi: "चीन", es: "China", fr: "Chine", pt: "China" },
  "Colombia":         { ar: "كولومبيا", hi: "कोलंबिया", es: "Colombia", fr: "Colombie", pt: "Colômbia" },
  "Congo DR":         { ar: "الكونغو الديمقراطية", hi: "कांगो लोकतांत्रिक गणराज्य", es: "RD Congo", fr: "RD Congo", pt: "RD Congo" },
  "Costa Rica":       { ar: "كوستاريكا", hi: "कोस्टा रीका", es: "Costa Rica", fr: "Costa Rica", pt: "Costa Rica" },
  "Croatia":          { ar: "كرواتيا", hi: "क्रोएशिया", es: "Croacia", fr: "Croatie", pt: "Croácia" },
  "Czech Republic":   { ar: "جمهورية التشيك", hi: "चेक गणराज्य", es: "República Checa", fr: "République tchèque", pt: "República Tcheca" },
  "Czechia":          { ar: "جمهورية التشيك", hi: "चेक गणराज्य", es: "República Checa", fr: "République tchèque", pt: "República Tcheca" },
  // D
  "Denmark":          { ar: "الدنمارك", hi: "डेनमार्क", es: "Dinamarca", fr: "Danemark", pt: "Dinamarca" },
  // E
  "Ecuador":          { ar: "الإكوادور", hi: "इक्वाडोर", es: "Ecuador", fr: "Équateur", pt: "Equador" },
  "Egypt":            { ar: "مصر", hi: "मिस्र", es: "Egipto", fr: "Égypte", pt: "Egito" },
  "El Salvador":      { ar: "السلفادور", hi: "अल सल्वाडोर", es: "El Salvador", fr: "Salvador", pt: "El Salvador" },
  "England":          { ar: "إنجلترا", hi: "इंग्लैंड", es: "Inglaterra", fr: "Angleterre", pt: "Inglaterra" },
  // F
  "Finland":          { ar: "فنلندا", hi: "फ़िनलैंड", es: "Finlandia", fr: "Finlande", pt: "Finlândia" },
  "France":           { ar: "فرنسا", hi: "फ्रांस", es: "Francia", fr: "France", pt: "França" },
  // G
  "Georgia":          { ar: "جورجيا", hi: "जॉर्जिया", es: "Georgia", fr: "Géorgie", pt: "Geórgia" },
  "Germany":          { ar: "ألمانيا", hi: "जर्मनी", es: "Alemania", fr: "Allemagne", pt: "Alemanha" },
  "Ghana":            { ar: "غانا", hi: "घाना", es: "Ghana", fr: "Ghana", pt: "Gana" },
  "Greece":           { ar: "اليونان", hi: "यूनान", es: "Grecia", fr: "Grèce", pt: "Grécia" },
  "Guatemala":        { ar: "غواتيمالا", hi: "ग्वाटेमाला", es: "Guatemala", fr: "Guatemala", pt: "Guatemala" },
  "Guinea":           { ar: "غينيا", hi: "गिनी", es: "Guinea", fr: "Guinée", pt: "Guiné" },
  // H
  "Haiti":            { ar: "هايتي", hi: "हैती", es: "Haití", fr: "Haïti", pt: "Haiti" },
  "Honduras":         { ar: "هندوراس", hi: "होंडुरस", es: "Honduras", fr: "Honduras", pt: "Honduras" },
  "Hungary":          { ar: "المجر", hi: "हंगरी", es: "Hungría", fr: "Hongrie", pt: "Hungria" },
  // I
  "Iceland":          { ar: "آيسلندا", hi: "आइसलैंड", es: "Islandia", fr: "Islande", pt: "Islândia" },
  "India":            { ar: "الهند", hi: "भारत", es: "India", fr: "Inde", pt: "Índia" },
  "Indonesia":        { ar: "إندونيسيا", hi: "इंडोनेशिया", es: "Indonesia", fr: "Indonésie", pt: "Indonésia" },
  "Iran":             { ar: "إيران", hi: "ईरान", es: "Irán", fr: "Iran", pt: "Irã" },
  "Iraq":             { ar: "العراق", hi: "इराक़", es: "Irak", fr: "Irak", pt: "Iraque" },
  "Ireland":          { ar: "أيرلندا", hi: "आयरलैंड", es: "Irlanda", fr: "Irlande", pt: "Irlanda" },
  "Republic of Ireland": { ar: "جمهورية أيرلندا", hi: "आयरलैंड गणराज्य", es: "República de Irlanda", fr: "République d'Irlande", pt: "República da Irlanda" },
  "Israel":           { ar: "إسرائيل", hi: "इज़राइल", es: "Israel", fr: "Israël", pt: "Israel" },
  "Italy":            { ar: "إيطاليا", hi: "इटली", es: "Italia", fr: "Italie", pt: "Itália" },
  "Ivory Coast":      { ar: "ساحل العاج", hi: "कोत दिव्वार", es: "Costa de Marfil", fr: "Côte d'Ivoire", pt: "Costa do Marfim" },
  "Côte d'Ivoire":    { ar: "ساحل العاج", hi: "कोत दिव्वार", es: "Costa de Marfil", fr: "Côte d'Ivoire", pt: "Costa do Marfim" },
  // J
  "Jamaica":          { ar: "جامايكا", hi: "जमैका", es: "Jamaica", fr: "Jamaïque", pt: "Jamaica" },
  "Japan":            { ar: "اليابان", hi: "जापान", es: "Japón", fr: "Japon", pt: "Japão" },
  "Jordan":           { ar: "الأردن", hi: "जॉर्डन", es: "Jordania", fr: "Jordanie", pt: "Jordânia" },
  // K
  "Kenya":            { ar: "كينيا", hi: "केन्या", es: "Kenia", fr: "Kenya", pt: "Quênia" },
  "Korea Republic":   { ar: "كوريا الجنوبية", hi: "दक्षिण कोरिया", es: "Corea del Sur", fr: "Corée du Sud", pt: "Coreia do Sul" },
  "South Korea":      { ar: "كوريا الجنوبية", hi: "दक्षिण कोरिया", es: "Corea del Sur", fr: "Corée du Sud", pt: "Coreia do Sul" },
  "Kuwait":           { ar: "الكويت", hi: "कुवैत", es: "Kuwait", fr: "Koweït", pt: "Kuwait" },
  // L
  "Lebanon":          { ar: "لبنان", hi: "लेबनान", es: "Líbano", fr: "Liban", pt: "Líbano" },
  "Libya":            { ar: "ليبيا", hi: "लीबिया", es: "Libia", fr: "Libye", pt: "Líbia" },
  // M
  "Mali":             { ar: "مالي", hi: "माली", es: "Malí", fr: "Mali", pt: "Mali" },
  "Mexico":           { ar: "المكسيك", hi: "मेक्सिको", es: "México", fr: "Mexique", pt: "México" },
  "Montenegro":       { ar: "الجبل الأسود", hi: "मोंटेनेग्रो", es: "Montenegro", fr: "Monténégro", pt: "Montenegro" },
  "Morocco":          { ar: "المغرب", hi: "मोरक्को", es: "Marruecos", fr: "Maroc", pt: "Marrocos" },
  "Mozambique":       { ar: "موزمبيق", hi: "मोज़ाम्बीक़", es: "Mozambique", fr: "Mozambique", pt: "Moçambique" },
  // N
  "Namibia":          { ar: "ناميبيا", hi: "नामीबिया", es: "Namibia", fr: "Namibie", pt: "Namíbia" },
  "Nepal":            { ar: "نيبال", hi: "नेपाल", es: "Nepal", fr: "Népal", pt: "Nepal" },
  "Netherlands":      { ar: "هولندا", hi: "नीदरलैंड", es: "Países Bajos", fr: "Pays-Bas", pt: "Holanda" },
  "New Zealand":      { ar: "نيوزيلندا", hi: "न्यूज़ीलैंड", es: "Nueva Zelanda", fr: "Nouvelle-Zélande", pt: "Nova Zelândia" },
  "Nigeria":          { ar: "نيجيريا", hi: "नाइजीरिया", es: "Nigeria", fr: "Nigéria", pt: "Nigéria" },
  "North Korea":      { ar: "كوريا الشمالية", hi: "उत्तर कोरिया", es: "Corea del Norte", fr: "Corée du Nord", pt: "Coreia do Norte" },
  "North Macedonia":  { ar: "مقدونيا الشمالية", hi: "उत्तर मैसेडोनिया", es: "Macedonia del Norte", fr: "Macédoine du Nord", pt: "Macedônia do Norte" },
  "Norway":           { ar: "النرويج", hi: "नॉर्वे", es: "Noruega", fr: "Norvège", pt: "Noruega" },
  // O
  "Oman":             { ar: "عُمان", hi: "ओमान", es: "Omán", fr: "Oman", pt: "Omã" },
  // P
  "Pakistan":         { ar: "باكستان", hi: "पाकिस्तान", es: "Pakistán", fr: "Pakistan", pt: "Paquistão" },
  "Palestine":        { ar: "فلسطين", hi: "फ़लस्तीन", es: "Palestina", fr: "Palestine", pt: "Palestina" },
  "Panama":           { ar: "بنما", hi: "पनामा", es: "Panamá", fr: "Panama", pt: "Panamá" },
  "Paraguay":         { ar: "باراغواي", hi: "पैराग्वे", es: "Paraguay", fr: "Paraguay", pt: "Paraguai" },
  "Peru":             { ar: "بيرو", hi: "पेरू", es: "Perú", fr: "Pérou", pt: "Peru" },
  "Philippines":      { ar: "الفلبين", hi: "फ़िलीपीन्स", es: "Filipinas", fr: "Philippines", pt: "Filipinas" },
  "Poland":           { ar: "بولندا", hi: "पोलैंड", es: "Polonia", fr: "Pologne", pt: "Polônia" },
  "Portugal":         { ar: "البرتغال", hi: "पुर्तगाल", es: "Portugal", fr: "Portugal", pt: "Portugal" },
  // Q
  "Qatar":            { ar: "قطر", hi: "क़तर", es: "Catar", fr: "Qatar", pt: "Catar" },
  // R
  "Romania":          { ar: "رومانيا", hi: "रोमानिया", es: "Rumanía", fr: "Roumanie", pt: "Romênia" },
  "Russia":           { ar: "روسيا", hi: "रूस", es: "Rusia", fr: "Russie", pt: "Rússia" },
  // S
  "Saudi Arabia":     { ar: "السعودية", hi: "सऊदी अरब", es: "Arabia Saudita", fr: "Arabie Saoudite", pt: "Arábia Saudita" },
  "Scotland":         { ar: "اسكتلندا", hi: "स्कॉटलैंड", es: "Escocia", fr: "Écosse", pt: "Escócia" },
  "Senegal":          { ar: "السنغال", hi: "सेनेगल", es: "Senegal", fr: "Sénégal", pt: "Senegal" },
  "Serbia":           { ar: "صربيا", hi: "सर्बिया", es: "Serbia", fr: "Serbie", pt: "Sérvia" },
  "Singapore":        { ar: "سنغافورة", hi: "सिंगापुर", es: "Singapur", fr: "Singapour", pt: "Singapura" },
  "Slovakia":         { ar: "سلوفاكيا", hi: "स्लोवाकिया", es: "Eslovaquia", fr: "Slovaquie", pt: "Eslováquia" },
  "Slovenia":         { ar: "سلوفينيا", hi: "स्लोवेनिया", es: "Eslovenia", fr: "Slovénie", pt: "Eslovênia" },
  "South Africa":     { ar: "جنوب أفريقيا", hi: "दक्षिण अफ़्रीका", es: "Sudáfrica", fr: "Afrique du Sud", pt: "África do Sul" },
  "Spain":            { ar: "إسبانيا", hi: "स्पेन", es: "España", fr: "Espagne", pt: "Espanha" },
  "Sri Lanka":        { ar: "سريلانكا", hi: "श्रीलंका", es: "Sri Lanka", fr: "Sri Lanka", pt: "Sri Lanka" },
  "Sudan":            { ar: "السودان", hi: "सूडान", es: "Sudán", fr: "Soudan", pt: "Sudão" },
  "Sweden":           { ar: "السويد", hi: "स्वीडन", es: "Suecia", fr: "Suède", pt: "Suécia" },
  "Switzerland":      { ar: "سويسرا", hi: "स्विट्ज़रलैंड", es: "Suiza", fr: "Suisse", pt: "Suíça" },
  "Syria":            { ar: "سوريا", hi: "सीरिया", es: "Siria", fr: "Syrie", pt: "Síria" },
  // T
  "Tanzania":         { ar: "تنزانيا", hi: "तंज़ानिया", es: "Tanzania", fr: "Tanzanie", pt: "Tanzânia" },
  "Thailand":         { ar: "تايلاند", hi: "थाईलैंड", es: "Tailandia", fr: "Thaïlande", pt: "Tailândia" },
  "Trinidad And Tobago": { ar: "ترينيداد وتوباغو", hi: "त्रिनिदाद और टोबैगो", es: "Trinidad y Tobago", fr: "Trinité-et-Tobago", pt: "Trinidad e Tobago" },
  "Tunisia":          { ar: "تونس", hi: "ट्यूनीशिया", es: "Túnez", fr: "Tunisie", pt: "Tunísia" },
  "Turkey":           { ar: "تركيا", hi: "तुर्की", es: "Turquía", fr: "Turquie", pt: "Turquia" },
  "Türkiye":          { ar: "تركيا", hi: "तुर्की", es: "Turquía", fr: "Turquie", pt: "Turquia" },
  // U
  "Uganda":           { ar: "أوغندا", hi: "युगांडा", es: "Uganda", fr: "Ouganda", pt: "Uganda" },
  "Ukraine":          { ar: "أوكرانيا", hi: "यूक्रेन", es: "Ucrania", fr: "Ukraine", pt: "Ucrânia" },
  "United Arab Emirates": { ar: "الإمارات العربية المتحدة", hi: "संयुक्त अरब अमीरात", es: "Emiratos Árabes Unidos", fr: "Émirats Arabes Unis", pt: "Emirados Árabes Unidos" },
  "UAE":              { ar: "الإمارات", hi: "संयुक्त अरब अमीरात", es: "EAU", fr: "EAU", pt: "EAU" },
  "United States":    { ar: "الولايات المتحدة", hi: "संयुक्त राज्य अमेरिका", es: "Estados Unidos", fr: "États-Unis", pt: "Estados Unidos" },
  "USA":              { ar: "الولايات المتحدة", hi: "अमेरिका", es: "EE.UU.", fr: "États-Unis", pt: "EUA" },
  "Uruguay":          { ar: "أوروغواي", hi: "उरुग्वे", es: "Uruguay", fr: "Uruguay", pt: "Uruguai" },
  "Uzbekistan":       { ar: "أوزبكستان", hi: "उज़्बेकिस्तान", es: "Uzbekistán", fr: "Ouzbékistan", pt: "Uzbequistão" },
  // V
  "Venezuela":        { ar: "فنزويلا", hi: "वेनेज़ुएला", es: "Venezuela", fr: "Venezuela", pt: "Venezuela" },
  "Vietnam":          { ar: "فيتنام", hi: "वियतनाम", es: "Vietnam", fr: "Viêt Nam", pt: "Vietnã" },
  // W
  "Wales":            { ar: "ويلز", hi: "वेल्स", es: "Gales", fr: "Pays de Galles", pt: "País de Gales" },
  "West Indies":      { ar: "جزر الهند الغربية", hi: "वेस्ट इंडीज़", es: "Indias Occidentales", fr: "Antilles", pt: "Índias Ocidentais" },
  // Z
  "Zambia":           { ar: "زامبيا", hi: "ज़ाम्बिया", es: "Zambia", fr: "Zambie", pt: "Zâmbia" },
  "Zimbabwe":         { ar: "زيمبابوي", hi: "ज़िम्बाब्वे", es: "Zimbabue", fr: "Zimbabwe", pt: "Zimbábue" },
};

export function translateTeamName(englishName: string, locale: Locale): string {
  if (locale === "en") return englishName;
  return TEAM_NAMES[englishName]?.[locale] ?? englishName;
}
