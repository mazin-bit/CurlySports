export interface TeamRef {
  code: string;
  abbr: string;
  name: string;
  score: number;
  logoUrl?: string | null;
}

export interface Match {
  id: string | number;
  home: TeamRef;
  away: TeamRef;
  league: string;
  leagueId?: string;
  sport?: string;
  status: 'live' | 'ft' | 'up';
  clock: string;
  focus?: boolean;
}

export interface MatchDetail {
  home: TeamRef;
  away: TeamRef;
  league: string;
  clock: string;
  half: string;
  venue: string;
  stats: [string, string, number][];
  momentum: number[];
  momentumB: number[];
  timeline: {
    min: string;
    type: 'goal' | 'yellow' | 'sub' | 'chance' | 'half';
    side: 'home' | 'away' | null;
    title: string;
    sub: string;
    score?: string;
  }[];
  lineups: {
    home: { formation: string; players: [string, string][] };
    away: { formation: string; players: [string, string][] };
  };
}

export interface Player {
  name: string; first: string; last: string; num: number; pos: string;
  team: string; teamCode: string; country: string; age: number; height: string;
  season: string;
  headline: [string, string][];
  radar: [string, number][];
  form: number[];
  note: string;
}

export interface DebatePost {
  id: number; author: string; handle: string; time: string; ava: string; avaTone: string;
  stance: string; pct: number; against: boolean;
  text: string;
  evidence: [string, string][];
  up: number; replies: number;
}

export interface NewsItem {
  id: number; tag: string; tone?: string; title: string; meta: string; src: string; icon: string; color: string;
}

export interface Notification {
  id: number; group: 'today' | 'earlier'; icon: string; color: string;
  title: string; body: string; time: string; unread: boolean;
}

export const DATA = {
  mascot: '/curly-mark.png',

  liveFootball: [
    { id: 1, home: { code: 'mun', abbr: 'MUN', name: 'Man United', score: 2 }, away: { code: 'che', abbr: 'CHE', name: 'Chelsea', score: 1 }, league: 'EPL', status: 'live', clock: "74'", focus: true },
    { id: 2, home: { code: 'ars', abbr: 'ARS', name: 'Arsenal', score: 3 }, away: { code: 'liv', abbr: 'LIV', name: 'Liverpool', score: 2 }, league: 'EPL', status: 'live', clock: "51'" },
    { id: 3, home: { code: 'cit', abbr: 'CIT', name: 'Man City', score: 0 }, away: { code: 'tot', abbr: 'TOT', name: 'Tottenham', score: 0 }, league: 'EPL', status: 'live', clock: "19'" },
    { id: 4, home: { code: 'bar', abbr: 'BAR', name: 'Barcelona', score: 1 }, away: { code: 'rm', abbr: 'RM', name: 'Real Madrid', score: 1 }, league: 'LALIGA', status: 'up', clock: '20:00' },
    { id: 5, home: { code: 'bay', abbr: 'BAY', name: 'Bayern', score: 4 }, away: { code: 'psg', abbr: 'PSG', name: 'PSG', score: 1 }, league: 'UCL', status: 'ft', clock: 'FT' },
  ] as Match[],

  liveOther: [
    { id: 6, home: { code: 'lal', abbr: 'LAL', name: 'LA Lakers', score: 112 }, away: { code: 'bos', abbr: 'BOS', name: 'Celtics', score: 98 }, league: 'NBA', status: 'live', clock: 'Q4 3:42' },
  ] as Match[],

  topScorer: { name: 'Erling Haaland', goals: 26, team: 'Man City', code: 'cit' },

  matchDetail: {
    home: { code: 'mun', abbr: 'MUN', name: 'Man United', score: 2 },
    away: { code: 'che', abbr: 'CHE', name: 'Chelsea', score: 1 },
    league: 'Premier League', clock: "74'", half: '2nd half', venue: 'Old Trafford · 73,210',
    stats: [['Possession', '52%', 52], ['xG', '2.31', 69], ['Shots', '14', 60], ['Shots on target', '6', 50], ['Corners', '7', 64], ['Pass accuracy', '84%', 84]] as [string, string, number][],
    momentum: [18, 22, 31, 38, 42, 35, 28, 45, 52, 38, 31, 24, 35, 48, 55, 42, 36],
    momentumB: [35, 28, 22, 18, 25, 38, 45, 32, 22, 38, 45, 52, 42, 32, 24, 38, 44],
    timeline: [
      { min: "9'", type: 'goal', side: 'home', title: 'Goal — Rasmus Højlund', sub: 'Assist · Bruno Fernandes', score: '1–0' },
      { min: "23'", type: 'yellow', side: 'away', title: 'Yellow card — Moisés Caicedo', sub: 'Tactical foul' },
      { min: "38'", type: 'goal', side: 'away', title: 'Goal — Cole Palmer', sub: 'Penalty, bottom corner', score: '1–1' },
      { min: "45'+2", type: 'half', side: null, title: 'Half time', sub: 'Man United 1 · 1 Chelsea' },
      { min: "61'", type: 'goal', side: 'home', title: 'Goal — Bruno Fernandes', sub: 'Curled free-kick, top corner', score: '2–1' },
      { min: "68'", type: 'sub', side: 'away', title: 'Sub — Chelsea', sub: 'Nkunku on · Jackson off' },
      { min: "74'", type: 'chance', side: 'home', title: 'Big chance — Garnacho', sub: 'Drags wide from 8 yards' },
    ],
    lineups: {
      home: { formation: '4-2-3-1', players: [['1','Onana'],['2','Dalot'],['19','Varane'],['6','Martínez'],['23','Shaw'],['18','Casemiro'],['37','Mainoo'],['8','B. Fernandes'],['10','Rashford'],['17','Garnacho'],['11','Højlund']] as [string,string][] },
      away: { formation: '4-3-3', players: [['1','Sánchez'],['24','James'],['6','Silva'],['33','Fofana'],['3','Cucurella'],['25','Caicedo'],['8','Enzo'],['20','Palmer'],['7','Sterling'],['15','Jackson'],['11','Madueke']] as [string,string][] },
    },
  } as MatchDetail,

  player: {
    name: 'Erling Haaland', first: 'Erling', last: 'Haaland', num: 9, pos: 'Striker',
    team: 'Manchester City', teamCode: 'cit', country: 'Norway', age: 25, height: '1.95m',
    season: '2025/26 · Premier League',
    headline: [['Goals', '26'], ['Assists', '5'], ['xG', '22.4'], ['Mins', '2,340']] as [string,string][],
    radar: [['Finishing', 97], ['Aerial', 92], ['Pace', 88], ['Hold-up', 79], ['Passing', 64], ['Dribbling', 71]] as [string,number][],
    form: [2, 1, 0, 3, 1, 2, 0, 1, 2],
    note: '26 goals from 22.4 xG — finishing +4 above expectation. Drops to 0.35 g/game vs the top-6, the engine of today\'s debate.',
  } as Player,

  standings: [
    ['mun', 'Man United', 1, 72, '+38', 'WWWDW'],
    ['ars', 'Arsenal', 2, 68, '+31', 'WDWWL'],
    ['cit', 'Man City', 3, 66, '+40', 'WWLWW'],
    ['liv', 'Liverpool', 4, 61, '+24', 'DWWLW'],
    ['che', 'Chelsea', 5, 55, '+12', 'LWDWL'],
    ['tot', 'Tottenham', 6, 51, '+8', 'WLDWD'],
  ] as [string, string, number, number, string, string][],

  debates: [
    {
      id: 1, author: 'TacticalView', handle: '@tactical', time: '2h', ava: 'T', avaTone: 'ink',
      stance: 'YES', pct: 61, against: false,
      text: "Haaland's xG drops 38% in UCL knockouts vs top-6 teams. He averages 0.35 goals/game in those — the data is right there.",
      evidence: [['Goals in big games', '0.35 /g'], ['xG drop', '−38%'], ['Sample', '42 matches']],
      up: 1240, replies: 312,
    },
    {
      id: 2, author: 'Cityzen99', handle: '@cityzen', time: '45m', ava: 'C', avaTone: 'orange',
      stance: 'NO', pct: 39, against: true,
      text: "Cherry-picking. He still scores more than any striker in Europe. The team creates less in those games — that's not on him.",
      evidence: [['Goals/90 (season)', '0.91'], ['Big chances (team)', '−42%']],
      up: 803, replies: 188,
    },
  ] as DebatePost[],

  news: [
    { id: 1, tag: 'Breaking', tone: 'hot', title: "Bruno's free-kick puts United ahead in a frantic Old Trafford derby", meta: 'now', src: 'Curly Live', icon: 'flame', color: '#ff5b3d' },
    { id: 2, tag: 'Analysis', title: "Haaland's xG drop in big games — what the numbers actually show", meta: '3h ago', src: 'The Athletic', icon: 'bolt', color: '#c8ff3d' },
    { id: 3, tag: 'Champions League', title: "Bayern's high-line dilemma vs United's counter — a tactical preview", meta: '5h ago', src: "Coaches' Voice", icon: 'trophy', color: '#7c5cff' },
    { id: 4, tag: 'Transfer', title: "Three names on Chelsea's striker shortlist for the summer window", meta: '6h ago', src: 'Fabrizio R.', icon: 'user', color: '#38c9ff' },
  ] as NewsItem[],

  notifications: [
    { id: 1, group: 'today', icon: 'live', color: '#ff4444', title: 'GOAL · Man United 2–1 Chelsea', body: 'Bruno Fernandes 61′ — curled free-kick.', time: 'now', unread: true },
    { id: 2, group: 'today', icon: 'spark', color: '#ff5b3d', title: 'Your take is heating up', body: '312 replies on "Does Haaland go missing in big games?"', time: '12m', unread: true },
    { id: 3, group: 'today', icon: 'flame', color: '#c8ff3d', title: 'Haaland hit 26 goals this season', body: '+4 above his xG — a new career best.', time: '1h', unread: true },
    { id: 4, group: 'earlier', icon: 'bell', color: '#7c5cff', title: 'Match starting soon', body: 'Man City vs Tottenham kicks off in 30 mins.', time: '3h', unread: false },
    { id: 5, group: 'earlier', icon: 'trophy', color: '#38c9ff', title: 'Arsenal go second', body: 'A 3–2 win over Liverpool lifts them above City.', time: '5h', unread: false },
    { id: 6, group: 'earlier', icon: 'heart', color: '#ff5d9e', title: 'TacticalView followed you', body: 'They bring receipts. You two should debate.', time: '1d', unread: false },
  ] as Notification[],

  trending: ['Haaland xG', 'United vs Chelsea', 'Cole Palmer', 'Top scorers', 'Bruno free-kick', 'Title race'],

  searchTeams: [
    ['mun', 'Man United', 'Premier League'],
    ['che', 'Chelsea', 'Premier League'],
    ['ars', 'Arsenal', 'Premier League'],
    ['cit', 'Man City', 'Premier League'],
    ['liv', 'Liverpool', 'Premier League'],
    ['bar', 'Barcelona', 'LaLiga'],
  ] as [string, string, string][],

  searchPlayers: [
    ['Erling Haaland', 'Man City · ST', 'cit'],
    ['Cole Palmer', 'Chelsea · AM', 'che'],
    ['Bruno Fernandes', 'Man United · MF', 'mun'],
    ['Bukayo Saka', 'Arsenal · RW', 'ars'],
  ] as [string, string, string][],

  pickTeams: [
    ['mun', 'Man United'], ['ars', 'Arsenal'], ['cit', 'Man City'], ['liv', 'Liverpool'],
    ['che', 'Chelsea'], ['tot', 'Tottenham'], ['bar', 'Barcelona'], ['rm', 'Real Madrid'],
    ['bay', 'Bayern'], ['lal', 'Lakers'], ['bos', 'Celtics'], ['psg', 'PSG'],
  ] as [string, string][],
};
