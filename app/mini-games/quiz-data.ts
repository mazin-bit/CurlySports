export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  difficulty: "easy" | "medium" | "hard";
}

export const QUIZ_DATA: Record<string, QuizQuestion[]> = {
  /* ------------------------------------------------------------------ */
  /*  FOOTBALL (SOCCER)                                                  */
  /* ------------------------------------------------------------------ */
  football: [
    // --- EASY ---
    {
      q: "How many players does each team field on the pitch in a standard football match?",
      options: ["9", "10", "11", "12"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which country won the 2022 FIFA World Cup in Qatar?",
      options: ["France", "Brazil", "Argentina", "Croatia"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is the standard duration of a professional football match (excluding extra time)?",
      options: ["80 minutes", "90 minutes", "100 minutes", "120 minutes"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which player is known as 'CR7'?",
      options: ["Lionel Messi", "Cristiano Ronaldo", "Neymar", "Kylian Mbappe"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What color card is shown to a player being sent off?",
      options: ["Yellow", "Green", "Red", "Blue"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which club has won the most UEFA Champions League titles?",
      options: ["AC Milan", "Barcelona", "Real Madrid", "Bayern Munich"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which country has won the most FIFA World Cup titles?",
      options: ["Germany", "Argentina", "Italy", "Brazil"],
      answer: 3,
      difficulty: "easy",
    },
    {
      q: "What is the name of the trophy awarded to the best football player each year by France Football magazine?",
      options: ["Golden Boot", "Ballon d'Or", "FIFA Best", "Puskas Award"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "In which sport does a 'penalty kick' occur from 12 yards out?",
      options: ["Rugby", "Hockey", "Football", "Handball"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which English club is nicknamed 'The Red Devils'?",
      options: ["Liverpool", "Arsenal", "Manchester United", "Chelsea"],
      answer: 2,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "Who holds the record for the most goals scored in FIFA World Cup history?",
      options: ["Ronaldo (Brazil)", "Miroslav Klose", "Pele", "Gerd Muller"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which player has won the most Ballon d'Or awards?",
      options: ["Cristiano Ronaldo", "Johan Cruyff", "Lionel Messi", "Michel Platini"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What does the offside rule in football require?",
      options: [
        "A player must be in their own half when the ball is played",
        "At least two opponents (including the goalkeeper) must be between the attacker and the goal line when the ball is played",
        "The attacker must not be within the penalty area",
        "The ball must be played forward at all times",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which stadium is known as 'The Theatre of Dreams'?",
      options: ["Anfield", "Old Trafford", "Camp Nou", "Santiago Bernabeu"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Who scored the 'Hand of God' goal in the 1986 World Cup?",
      options: ["Pele", "Diego Maradona", "Zinedine Zidane", "Johan Cruyff"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which club completed an invincible Premier League season in 2003-04?",
      options: ["Chelsea", "Manchester United", "Arsenal", "Liverpool"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the maximum number of substitutions allowed in a standard FIFA match as of 2024?",
      options: ["3", "4", "5", "6"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which nation hosted the first ever FIFA World Cup in 1930?",
      options: ["Brazil", "Italy", "Uruguay", "France"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Who is the all-time top scorer in Premier League history?",
      options: ["Wayne Rooney", "Thierry Henry", "Alan Shearer", "Andrew Cole"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What does VAR stand for in football?",
      options: [
        "Video Assisted Replay",
        "Video Assistant Referee",
        "Virtual Analysis Review",
        "Video Adjudication Referee",
      ],
      answer: 1,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Which player scored the fastest hat-trick in Premier League history (completed in 2 minutes 56 seconds)?",
      options: ["Robbie Fowler", "Sadio Mane", "Alan Shearer", "Michael Owen"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who was the first African nation to reach the FIFA World Cup quarter-finals?",
      options: ["Nigeria", "Cameroon", "Senegal", "Ghana"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What was the record transfer fee paid for Neymar when he moved to Paris Saint-Germain in 2017?",
      options: ["180 million euros", "200 million euros", "222 million euros", "250 million euros"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Which goalkeeper holds the record for the most consecutive clean sheets in La Liga?",
      options: ["Iker Casillas", "Jan Oblak", "Victor Valdes", "Abel Resino"],
      answer: 3,
      difficulty: "hard",
    },
    {
      q: "In what year was the back-pass rule introduced, preventing goalkeepers from handling deliberate back passes?",
      options: ["1986", "1990", "1992", "1994"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Which club won the first ever European Cup (now Champions League) in 1956?",
      options: ["Benfica", "AC Milan", "Real Madrid", "Barcelona"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Who is the youngest player to score in a FIFA World Cup final?",
      options: ["Kylian Mbappe", "Pele", "Michael Owen", "Ronaldo"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the record for the most goals scored by a single player in a calendar year?",
      options: ["85 goals (Messi, 2012)", "69 goals (Muller, 1972)", "91 goals (Messi, 2012)", "84 goals (Ronaldo, 2013)"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Which country won the Olympic gold medal in men's football at the 1900 Paris Games, the first time football was included?",
      options: ["France", "Great Britain", "Upton Park FC (Great Britain)", "Belgium"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Bosman ruling' in football?",
      options: [
        "A rule allowing unlimited substitutions in friendlies",
        "A 1995 EU court ruling allowing free movement of players at end of contract",
        "A ban on third-party ownership of players",
        "A financial fair play regulation by UEFA",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which team famously came back from 3-0 down at half-time to win the 2005 Champions League final on penalties?",
      options: ["Barcelona", "AC Milan", "Liverpool", "Manchester United"],
      answer: 2,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  CRICKET                                                            */
  /* ------------------------------------------------------------------ */
  cricket: [
    // --- EASY ---
    {
      q: "How many players are there in a cricket team?",
      options: ["9", "10", "11", "12"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How many runs is a boundary along the ground worth in cricket?",
      options: ["2", "4", "6", "8"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many runs does a batsman score when the ball clears the boundary without bouncing?",
      options: ["4", "5", "6", "8"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How many overs are played per innings in a standard T20 match?",
      options: ["10", "20", "30", "50"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which country is the IPL (Indian Premier League) based in?",
      options: ["Pakistan", "Australia", "India", "England"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What are the three stumps at each end of the pitch collectively called?",
      options: ["The crease", "The wicket", "The popping crease", "The boundary"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Who is known as the 'God of Cricket'?",
      options: ["Virat Kohli", "Sachin Tendulkar", "MS Dhoni", "Ricky Ponting"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many overs are played per innings in a One Day International (ODI)?",
      options: ["20", "30", "40", "50"],
      answer: 3,
      difficulty: "easy",
    },
    {
      q: "What does 'LBW' stand for in cricket?",
      options: ["Long Boundary Wicket", "Leg Before Wicket", "Left Bowler Wins", "Last Ball Won"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which series is contested between England and Australia in Test cricket?",
      options: ["The Border-Gavaskar Trophy", "The Ashes", "The Wisden Trophy", "The Frank Worrell Trophy"],
      answer: 1,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "Which batsman has scored the most runs in international cricket history?",
      options: ["Ricky Ponting", "Kumar Sangakkara", "Sachin Tendulkar", "Jacques Kallis"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What does 'DRS' stand for in cricket?",
      options: [
        "Direct Replay System",
        "Decision Review System",
        "Digital Review Standard",
        "Dismissal Review System",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Who scored the first ever double century in ODI cricket?",
      options: ["Sachin Tendulkar", "Virender Sehwag", "Rohit Sharma", "Martin Guptill"],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "What is the 'Powerplay' in limited-overs cricket?",
      options: [
        "Extra time after a tied match",
        "A phase where fielding restrictions apply",
        "A bonus over for the batting team",
        "A period where only fast bowlers can bowl",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which Australian cricketer holds the record for the highest individual Test score of 400 not out?",
      options: ["Don Bradman", "Matthew Hayden", "Brian Lara", "Steve Smith"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Who won the inaugural ICC Cricket World Cup in 1975?",
      options: ["Australia", "India", "West Indies", "England"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is Sir Don Bradman's famous Test batting average?",
      options: ["89.78", "95.14", "99.94", "102.30"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which bowler has taken the most wickets in Test cricket history?",
      options: ["Shane Warne", "Muttiah Muralitharan", "James Anderson", "Anil Kumble"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which team won the 2023 ODI Cricket World Cup held in India?",
      options: ["India", "Australia", "England", "South Africa"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is a 'hat-trick' in cricket?",
      options: [
        "Scoring three centuries in a row",
        "Winning three matches in a row",
        "Taking three wickets on three consecutive deliveries",
        "Hitting three sixes in a row",
      ],
      answer: 2,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Who holds the record for the fastest century in ODI cricket (off 31 balls)?",
      options: ["Chris Gayle", "AB de Villiers", "Shahid Afridi", "Corey Anderson"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Brian Lara's record individual Test score of 400 not out was made against which team?",
      options: ["Australia", "India", "England", "South Africa"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Which cricketer has scored the most runs in a single edition of the IPL?",
      options: ["Virat Kohli", "David Warner", "Chris Gayle", "Jos Buttler"],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "In the famous 2019 World Cup final, how was the winner decided after the Super Over was also tied?",
      options: [
        "A second Super Over",
        "Boundary count back",
        "Coin toss",
        "Highest run rate in group stage",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who has hit the most sixes in international cricket history?",
      options: ["Chris Gayle", "Shahid Afridi", "Rohit Sharma", "Brendon McCullum"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Which team recorded the lowest total in Test cricket history with 26 all out in 1955?",
      options: ["Bangladesh", "New Zealand", "Zimbabwe", "South Africa"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is a 'Mankad' dismissal in cricket?",
      options: [
        "Bowler knocking the bails off at the non-striker's end during delivery stride when the batsman backs up too far",
        "A batsman hitting the ball twice deliberately",
        "A fielder catching the ball after it bounces off another fielder",
        "The keeper stumping the batsman off a wide delivery",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "Which spinner took all 10 wickets in a single Test innings against Pakistan in 1999?",
      options: ["Muttiah Muralitharan", "Shane Warne", "Anil Kumble", "Harbhajan Singh"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Which country won the inaugural ICC T20 World Cup in 2007?",
      options: ["Pakistan", "India", "Australia", "Sri Lanka"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the term for scoring zero runs in cricket, derived from the shape of the number?",
      options: ["Nil", "Duck", "Goose", "Blank"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who captained Australia to their 2023 ODI World Cup victory in India?",
      options: ["Steve Smith", "David Warner", "Pat Cummins", "Mitchell Marsh"],
      answer: 2,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  BASKETBALL (NBA)                                                   */
  /* ------------------------------------------------------------------ */
  basketball: [
    // --- EASY ---
    {
      q: "How many players from each team are on the court during a basketball game?",
      options: ["4", "5", "6", "7"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many points is a standard field goal worth in basketball?",
      options: ["1", "2", "3", "4"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many points is a shot worth if made from beyond the three-point line?",
      options: ["1", "2", "3", "4"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How many quarters are in an NBA game?",
      options: ["2", "3", "4", "5"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which player is widely considered the greatest basketball player of all time, with 6 NBA titles and the Chicago Bulls?",
      options: ["LeBron James", "Kareem Abdul-Jabbar", "Michael Jordan", "Kobe Bryant"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is the height of a regulation NBA basketball hoop from the floor?",
      options: ["8 feet", "9 feet", "10 feet", "11 feet"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which team has won the most NBA championships?",
      options: ["Los Angeles Lakers", "Chicago Bulls", "Golden State Warriors", "Boston Celtics"],
      answer: 3,
      difficulty: "easy",
    },
    {
      q: "What is it called when a player scores a basket by jumping and pushing the ball through the hoop from above?",
      options: ["Layup", "Hook shot", "Slam dunk", "Floater"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which NBA player is known as 'King James'?",
      options: ["James Harden", "LeBron James", "Michael Jordan", "Kevin Durant"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many seconds does the shot clock give an NBA team to attempt a shot?",
      options: ["20", "24", "30", "35"],
      answer: 1,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "Who is the all-time leading scorer in NBA history?",
      options: ["Michael Jordan", "Kareem Abdul-Jabbar", "Karl Malone", "LeBron James"],
      answer: 3,
      difficulty: "medium",
    },
    {
      q: "Which player scored 100 points in a single NBA game?",
      options: ["Michael Jordan", "Kobe Bryant", "Wilt Chamberlain", "LeBron James"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is a 'triple-double' in basketball?",
      options: [
        "Scoring 30+ points three games in a row",
        "Recording double-digit numbers in three statistical categories in one game",
        "Making three consecutive three-pointers",
        "Playing in three overtime periods",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which team won the 2024 NBA Championship?",
      options: ["Denver Nuggets", "Boston Celtics", "Dallas Mavericks", "Miami Heat"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "How many personal fouls result in a player being ejected from an NBA game?",
      options: ["4", "5", "6", "7"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which player holds the record for the most assists in NBA history?",
      options: ["Magic Johnson", "Steve Nash", "John Stockton", "Chris Paul"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What NBA team did Kobe Bryant spend his entire career with?",
      options: ["Boston Celtics", "Golden State Warriors", "Los Angeles Lakers", "New York Knicks"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Who was the first overall pick in the 2023 NBA Draft?",
      options: ["Scoot Henderson", "Brandon Miller", "Victor Wembanyama", "Chet Holmgren"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the name of the NBA's annual rookie showcase game?",
      options: ["Rising Stars", "Rookie Challenge", "Future Stars", "Next Gen Game"],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "Which team famously won 73 regular-season games in the 2015-16 season?",
      options: ["San Antonio Spurs", "Golden State Warriors", "Chicago Bulls", "Los Angeles Lakers"],
      answer: 1,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Which player holds the record for most rebounds in a single NBA game with 55?",
      options: ["Bill Russell", "Wilt Chamberlain", "Dennis Rodman", "Moses Malone"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What was the original name of the Oklahoma City Thunder franchise?",
      options: ["Vancouver Grizzlies", "Seattle SuperSonics", "New Jersey Nets", "Charlotte Bobcats"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who holds the NBA record for most career steals?",
      options: ["Gary Payton", "Michael Jordan", "John Stockton", "Scottie Pippen"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "In what year was the three-point line introduced in the NBA?",
      options: ["1975", "1979", "1983", "1986"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which player has the most career triple-doubles in NBA history?",
      options: ["Magic Johnson", "LeBron James", "Oscar Robertson", "Russell Westbrook"],
      answer: 3,
      difficulty: "hard",
    },
    {
      q: "Who was the first player drafted directly out of high school in the modern NBA era (1995)?",
      options: ["Kobe Bryant", "Kevin Garnett", "LeBron James", "Tracy McGrady"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the longest winning streak in NBA history?",
      options: ["30 games", "33 games", "36 games", "39 games"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which WNBA player is the all-time leading scorer in league history?",
      options: ["Sue Bird", "Diana Taurasi", "Candace Parker", "Tina Thompson"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which team won the first ever NBA championship in 1947 (then called the BAA)?",
      options: ["Minneapolis Lakers", "Boston Celtics", "Philadelphia Warriors", "New York Knicks"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Who is the youngest player to score 10,000 career points in NBA history?",
      options: ["Kobe Bryant", "Kevin Durant", "LeBron James", "Tracy McGrady"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Hack-a-Shaq' strategy in basketball?",
      options: [
        "A defensive play designed to block Shaquille O'Neal's dunks",
        "Intentionally fouling a poor free-throw shooter to send them to the line",
        "A zone defense created to contain dominant centers",
        "A fast-break play named after Shaquille O'Neal",
      ],
      answer: 1,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  FORMULA 1                                                          */
  /* ------------------------------------------------------------------ */
  f1: [
    // --- EASY ---
    {
      q: "How many teams currently compete in a Formula 1 season?",
      options: ["8", "10", "12", "14"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What color flag is waved to signal the end of a Formula 1 race?",
      options: ["Red", "Yellow", "Green", "Chequered (black and white)"],
      answer: 3,
      difficulty: "easy",
    },
    {
      q: "How many drivers does each Formula 1 team field?",
      options: ["1", "2", "3", "4"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which driver won four consecutive F1 World Championships from 2020 to 2023?",
      options: ["Lewis Hamilton", "Sebastian Vettel", "Max Verstappen", "Fernando Alonso"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What does 'DRS' stand for in Formula 1?",
      options: [
        "Dynamic Racing System",
        "Drag Reduction System",
        "Driver Response Stabilizer",
        "Downforce Recovery System",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which team is known for its red cars and is the oldest F1 constructor?",
      options: ["McLaren", "Mercedes", "Ferrari", "Red Bull"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is a 'pit stop' in Formula 1?",
      options: [
        "A penalty for crashing",
        "When the race is stopped for rain",
        "A stop in the pit lane for tire changes, fuel, or repairs",
        "The starting position on the grid",
      ],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which British driver holds the record for seven F1 World Championships?",
      options: ["Nigel Mansell", "Lewis Hamilton", "Jenson Button", "Damon Hill"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What does a red flag mean during an F1 race?",
      options: [
        "Final lap",
        "DRS is enabled",
        "The session is stopped immediately",
        "A driver has been disqualified",
      ],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Where is the Monaco Grand Prix held?",
      options: ["Monaco", "Monte Carlo, Monaco", "Nice, France", "Monza, Italy"],
      answer: 0,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "Which driver holds the record for the most F1 race wins?",
      options: ["Michael Schumacher", "Ayrton Senna", "Lewis Hamilton", "Max Verstappen"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which constructor has won the most F1 Constructors' Championships?",
      options: ["McLaren", "Red Bull", "Ferrari", "Mercedes"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "How many points does the winner of an F1 Grand Prix receive?",
      options: ["20", "25", "30", "50"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is the fastest street circuit on the F1 calendar?",
      options: ["Monaco", "Singapore", "Baku (Azerbaijan)", "Jeddah (Saudi Arabia)"],
      answer: 3,
      difficulty: "medium",
    },
    {
      q: "Which team did Max Verstappen drive for when he won his first World Championship in 2021?",
      options: ["Mercedes", "Ferrari", "Red Bull Racing", "McLaren"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the minimum weight requirement for an F1 car including the driver?",
      options: ["600 kg", "698 kg", "798 kg", "900 kg"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which circuit is known as the 'Temple of Speed'?",
      options: ["Silverstone", "Monza", "Spa-Francorchamps", "Suzuka"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What type of tires are available in F1's dry tire compound range (softest to hardest)?",
      options: [
        "Ultra-soft, Super-soft, Soft",
        "Soft, Medium, Hard",
        "Prime, Option, Qualifier",
        "Hyper, Super, Standard",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "In which year did Ayrton Senna tragically lose his life at Imola?",
      options: ["1992", "1993", "1994", "1995"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the sprint race format in F1?",
      options: [
        "A half-distance race replacing qualifying",
        "A shorter race (approximately 100 km) held on Saturday, awarding points to the top 8",
        "A race only for reserve drivers",
        "A relay race between the two team drivers",
      ],
      answer: 1,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Who is the youngest ever F1 World Champion?",
      options: ["Lewis Hamilton", "Fernando Alonso", "Sebastian Vettel", "Max Verstappen"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the most F1 race wins achieved in a single season?",
      options: ["15 (Vettel, 2013)", "19 (Verstappen, 2023)", "14 (Schumacher, 2004)", "13 (Schumacher, 2004)"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which driver won the 1976 F1 Championship in a famous rivalry with Niki Lauda?",
      options: ["Emerson Fittipaldi", "James Hunt", "Mario Andretti", "Jody Scheckter"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What was the Concorde Agreement in F1?",
      options: [
        "A speed limit agreement for pit lanes",
        "A contract binding teams, the FIA, and the commercial rights holder regarding governance and revenue",
        "An agreement to ban ground-effect cars",
        "A safety protocol signed after the 1994 season",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which driver has the most pole positions in F1 history?",
      options: ["Ayrton Senna", "Michael Schumacher", "Lewis Hamilton", "Max Verstappen"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "In what year was the first ever Formula 1 World Championship race held?",
      options: ["1946", "1948", "1950", "1952"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Which F1 team is based in Faenza, Italy and has changed names multiple times (Minardi, Toro Rosso)?",
      options: ["Alpine", "Haas", "RB (Visa Cash App RB)", "Sauber"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 107% rule in F1 qualifying?",
      options: [
        "A driver must be within 107% of the fastest Q1 time to qualify for the race",
        "A car must weigh within 107% of the minimum weight",
        "Teams must spend within 107% of the cost cap",
        "Engines must perform within 107% of a benchmark power output",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "Who won the controversial 2021 Abu Dhabi Grand Prix to claim the World Championship?",
      options: ["Lewis Hamilton", "Max Verstappen", "Valtteri Bottas", "Sergio Perez"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which team did Ayrton Senna drive for when he won his first World Championship in 1988?",
      options: ["Williams", "McLaren", "Lotus", "Ferrari"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the 'halo' device in F1?",
      options: [
        "A ring of lights on the rear of the car indicating DRS activation",
        "A titanium cockpit protection structure above the driver's head",
        "An aerodynamic element on the front wing",
        "A braking system component",
      ],
      answer: 1,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  NFL                                                                */
  /* ------------------------------------------------------------------ */
  nfl: [
    // --- EASY ---
    {
      q: "How many players from each team are on the field during a play in American football?",
      options: ["9", "10", "11", "12"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How many points is a touchdown worth in the NFL?",
      options: ["3", "5", "6", "7"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is the championship game of the NFL called?",
      options: ["The World Series", "The Stanley Cup", "The Super Bowl", "The Finals"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How many downs does a team have to advance the ball 10 yards?",
      options: ["3", "4", "5", "6"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many points is a field goal worth?",
      options: ["1", "2", "3", "4"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which quarterback has won the most Super Bowl titles?",
      options: ["Peyton Manning", "Joe Montana", "Tom Brady", "Terry Bradshaw"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is the area at each end of the football field called where touchdowns are scored?",
      options: ["Goal line", "End zone", "Red zone", "Scoring area"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How long is an NFL football field (excluding end zones)?",
      options: ["80 yards", "90 yards", "100 yards", "110 yards"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How many teams are in the NFL?",
      options: ["28", "30", "32", "34"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What shape is an American football?",
      options: ["Round", "Prolate spheroid (oval)", "Hexagonal", "Cylindrical"],
      answer: 1,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "How many Super Bowls has Tom Brady won?",
      options: ["5", "6", "7", "8"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the 'two-minute warning' in the NFL?",
      options: [
        "A warning given to a player for unsportsmanlike conduct",
        "An automatic timeout when 2 minutes remain in each half",
        "A penalty for delaying the game",
        "A signal that overtime is about to begin",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which team won the most Super Bowls in NFL history (as of 2025)?",
      options: ["Dallas Cowboys", "San Francisco 49ers", "New England Patriots", "Pittsburgh Steelers"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is a 'sack' in football?",
      options: [
        "When the ball carrier fumbles the ball",
        "When the quarterback is tackled behind the line of scrimmage",
        "When a punt is blocked",
        "When a receiver drops a pass",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which wide receiver holds the NFL record for most career receiving yards?",
      options: ["Larry Fitzgerald", "Terrell Owens", "Randy Moss", "Jerry Rice"],
      answer: 3,
      difficulty: "medium",
    },
    {
      q: "What is the 'red zone' in football?",
      options: [
        "The area inside the 20-yard line near the end zone",
        "The area around the 50-yard line",
        "The penalty box for players who commit fouls",
        "The area behind the line of scrimmage",
      ],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "How many points is a successful extra point (PAT) kick after a touchdown worth?",
      options: ["1", "2", "3", "4"],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "What is the NFL Draft?",
      options: [
        "A mid-season trade event",
        "An annual event where teams select eligible college players",
        "A preseason tournament",
        "An all-star game selection process",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which running back holds the NFL record for most career rushing yards?",
      options: ["Walter Payton", "Barry Sanders", "Emmitt Smith", "Adrian Peterson"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What does 'NFL' stand for?",
      options: [
        "National Football League",
        "National Federation of Leagues",
        "North American Football League",
        "National Football Leaders",
      ],
      answer: 0,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Which team completed the only perfect season in NFL history (including Super Bowl) in 1972?",
      options: ["Dallas Cowboys", "Pittsburgh Steelers", "Miami Dolphins", "Oakland Raiders"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Immaculate Reception,' one of the most famous plays in NFL history?",
      options: [
        "A Hail Mary touchdown by the Dallas Cowboys",
        "Franco Harris catching a deflected pass to score a playoff TD for the Steelers in 1972",
        "A game-winning interception in Super Bowl III",
        "A blocked punt returned for a touchdown by the Raiders",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who holds the NFL record for most passing touchdowns in a single season with 55?",
      options: ["Tom Brady", "Patrick Mahomes", "Peyton Manning", "Drew Brees"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Salary Cap' in the NFL?",
      options: [
        "A maximum salary any single player can earn",
        "A limit on the total amount a team can spend on player salaries",
        "A tax on teams that spend over a certain amount",
        "A minimum salary requirement for rookie players",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which quarterback led the largest comeback in Super Bowl history, overcoming a 25-point deficit in Super Bowl LI?",
      options: ["Peyton Manning", "Tom Brady", "Patrick Mahomes", "Aaron Rodgers"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What year was the first Super Bowl played?",
      options: ["1960", "1964", "1967", "1970"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Who holds the NFL record for most career sacks?",
      options: ["Reggie White", "Bruce Smith", "Lawrence Taylor", "Michael Strahan"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is a 'safety' in football and how many points is it worth?",
      options: [
        "A defensive play worth 1 point",
        "Tackling the ball carrier in their own end zone, worth 2 points for the defense",
        "A type of penalty worth 3 points",
        "An interception returned for a touchdown, worth 6 points",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which team lost four consecutive Super Bowls from 1991 to 1994?",
      options: ["Minnesota Vikings", "Denver Broncos", "Buffalo Bills", "Philadelphia Eagles"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'franchise tag' in the NFL?",
      options: [
        "A permanent designation that prevents a player from ever being traded",
        "A one-year designation that allows a team to retain a player by paying the average of the top 5 salaries at their position",
        "A tag given to the MVP of each franchise",
        "A penalty applied to teams that violate the salary cap",
      ],
      answer: 1,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  TENNIS                                                             */
  /* ------------------------------------------------------------------ */
  tennis: [
    // --- EASY ---
    {
      q: "How many Grand Slam tournaments are there in tennis each year?",
      options: ["2", "3", "4", "5"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is the score called when both players have 40 points in a game?",
      options: ["Match point", "Deuce", "Advantage", "Break point"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which Grand Slam is played on grass courts?",
      options: ["French Open", "Australian Open", "Wimbledon", "US Open"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is the starting score in a tennis game called?",
      options: ["Zero", "Love", "Nil", "Nothing"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many sets does a player need to win to take a men's Grand Slam singles match?",
      options: ["2", "3", "4", "5"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What surface is the French Open played on?",
      options: ["Grass", "Hard court", "Clay", "Carpet"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which Serbian player has won the most Grand Slam singles titles in men's tennis?",
      options: ["Novak Djokovic", "Rafael Nadal", "Roger Federer", "Andy Murray"],
      answer: 0,
      difficulty: "easy",
    },
    {
      q: "What is it called when a server wins a game without the opponent scoring any points?",
      options: ["Ace", "Love game", "Bagel", "Breadstick"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which female player has won the most Grand Slam singles titles in the Open Era?",
      options: ["Steffi Graf", "Martina Navratilova", "Serena Williams", "Chris Evert"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is it called when the ball hits the net and lands in the correct service box?",
      options: ["Fault", "Let", "Ace", "Net point"],
      answer: 1,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "How many Grand Slam singles titles has Novak Djokovic won (as of 2025)?",
      options: ["20", "22", "24", "26"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which Grand Slam uses a final-set tiebreak at 6-6 as of 2022?",
      options: ["Only the US Open", "Only Wimbledon", "All four Grand Slams", "None of them"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is a 'bagel' in tennis?",
      options: [
        "Winning a set 6-0",
        "A type of serve",
        "A round-robin format",
        "A doubles formation",
      ],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "Which player has won the most French Open singles titles?",
      options: ["Bjorn Borg", "Novak Djokovic", "Roger Federer", "Rafael Nadal"],
      answer: 3,
      difficulty: "medium",
    },
    {
      q: "What is the Davis Cup?",
      options: [
        "An annual women's team tennis competition",
        "An annual men's team tennis competition between nations",
        "A clay court only tournament",
        "The trophy for the Australian Open",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is an 'ace' in tennis?",
      options: [
        "A serve that the returner cannot touch, winning the point outright",
        "A volley that ends the rally",
        "A lob that lands on the baseline",
        "A drop shot that bounces twice before the opponent reaches it",
      ],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "Which player is known as the 'King of Clay'?",
      options: ["Novak Djokovic", "Roger Federer", "Rafael Nadal", "Bjorn Borg"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "How many points do you need to win a tiebreak game?",
      options: ["5", "6", "7", "10"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which is the only Grand Slam originally played on grass before switching to hard courts?",
      options: ["French Open", "US Open", "Australian Open", "Both US Open and Australian Open"],
      answer: 3,
      difficulty: "medium",
    },
    {
      q: "What is the WTA?",
      options: [
        "World Tennis Association",
        "Women's Tennis Association",
        "World Tournament Authority",
        "Wimbledon Tennis Association",
      ],
      answer: 1,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Who was the last male player to win the Calendar Year Grand Slam (all 4 in one year)?",
      options: ["Roger Federer", "Rod Laver", "Rafael Nadal", "Novak Djokovic"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the longest tennis match in history by duration?",
      options: [
        "Federer vs. Nadal, Wimbledon 2008",
        "Isner vs. Mahut, Wimbledon 2010",
        "Djokovic vs. Nadal, Australian Open 2012",
        "Santoro vs. Clement, French Open 2004",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the score sequence in a standard tennis game?",
      options: [
        "0, 15, 30, 40, Game",
        "0, 10, 20, 30, 40, Game",
        "0, 15, 30, 45, Game",
        "1, 2, 3, 4, Game",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "Which player won the 'Golden Slam' (all 4 Grand Slams + Olympic Gold) in a single year?",
      options: ["Roger Federer (2009)", "Serena Williams (2015)", "Steffi Graf (1988)", "Novak Djokovic (2021)"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Sunshine Double'?",
      options: [
        "Winning both Wimbledon and the French Open",
        "Winning both Indian Wells and Miami back to back",
        "Winning the Australian Open and US Open in the same year",
        "Winning doubles and singles at the same tournament",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which left-handed player won 11 consecutive French Open finals from 2005 to 2014 (except 2009)?",
      options: ["John McEnroe", "Jimmy Connors", "Rafael Nadal", "Guillermo Vilas"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'serve and volley' style of play?",
      options: [
        "Serving underhand and rushing to the baseline",
        "Serving and immediately approaching the net to volley the return",
        "Alternating between serving and receiving each game",
        "A doubles strategy where both players serve simultaneously",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who was the first player to win 20 Grand Slam singles titles?",
      options: ["Novak Djokovic", "Roger Federer", "Rafael Nadal", "Pete Sampras"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "How many times did Serena Williams win the Australian Open singles title?",
      options: ["5", "6", "7", "8"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Hawk-Eye' system used for in tennis?",
      options: [
        "Measuring the speed of serves",
        "Ball-tracking technology used for line-call challenges and reviews",
        "Monitoring player fitness during matches",
        "Controlling stadium lighting",
      ],
      answer: 1,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  MMA / UFC                                                          */
  /* ------------------------------------------------------------------ */
  mma: [
    // --- EASY ---
    {
      q: "What does UFC stand for?",
      options: [
        "United Fighting Championship",
        "Ultimate Fighting Championship",
        "Universal Fighting Competition",
        "United Fight Club",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many rounds are in a standard non-title UFC fight?",
      options: ["2", "3", "4", "5"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many rounds are in a UFC championship fight?",
      options: ["3", "4", "5", "6"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is the shape of the UFC fighting area?",
      options: ["Square ring", "Circular ring", "Octagonal cage", "Rectangular ring"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is a 'knockout' (KO) in MMA?",
      options: [
        "When a fighter gives up",
        "When a fighter is rendered unconscious or unable to continue from strikes",
        "When a fighter is disqualified",
        "When the fight goes to a decision",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which Irish fighter became the first to hold UFC titles in two weight classes simultaneously?",
      options: ["Conor McGregor", "Georges St-Pierre", "Anderson Silva", "Jon Jones"],
      answer: 0,
      difficulty: "easy",
    },
    {
      q: "How long is each round in a UFC fight?",
      options: ["3 minutes", "5 minutes", "7 minutes", "10 minutes"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What does a fighter 'tapping out' signify?",
      options: [
        "They want a timeout",
        "They are submitting and conceding the fight",
        "They want to switch corners",
        "They are signaling to their coach",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What is the heaviest weight class in the UFC called?",
      options: ["Light Heavyweight", "Cruiserweight", "Super Heavyweight", "Heavyweight"],
      answer: 3,
      difficulty: "easy",
    },
    {
      q: "Which country has produced the most UFC champions?",
      options: ["Brazil", "Russia", "Ireland", "United States"],
      answer: 3,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "Which fighter is undefeated at 29-0 and famous for his dominant grappling style?",
      options: ["Georges St-Pierre", "Khabib Nurmagomedov", "Anderson Silva", "Kamaru Usman"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is a 'rear naked choke'?",
      options: [
        "A kick to the back of the head",
        "A chokehold applied from behind the opponent using the arms",
        "A takedown technique",
        "An illegal move in UFC",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Who holds the record for the most UFC title defenses at middleweight?",
      options: ["Israel Adesanya", "Anderson Silva", "Robert Whittaker", "Chris Weidman"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What weight limit defines the UFC Lightweight division?",
      options: ["145 lbs", "155 lbs", "170 lbs", "185 lbs"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Who is considered the greatest UFC heavyweight of all time?",
      options: ["Brock Lesnar", "Stipe Miocic", "Cain Velasquez", "Francis Ngannou"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is a 'guillotine choke'?",
      options: [
        "A choke applied by wrapping the arm around the opponent's neck from the front",
        "A spinning kick to the throat",
        "A wrestling pin hold",
        "A standing armbar technique",
      ],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "Who is known as 'Bones' and is considered one of the greatest MMA fighters ever?",
      options: ["Daniel Cormier", "Jon Jones", "Alexander Gustafsson", "Glover Teixeira"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is 'ground and pound' in MMA?",
      options: [
        "A type of diet for fighters",
        "Striking an opponent while in a dominant ground position",
        "A cardio exercise routine",
        "A grappling technique to control opponents",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which fighter holds the record for the most finishes in UFC history?",
      options: ["Anderson Silva", "Charles Oliveira", "Vitor Belfort", "Donald Cerrone"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What martial art is Khabib Nurmagomedov primarily known for?",
      options: ["Brazilian Jiu-Jitsu", "Muay Thai", "Sambo and Wrestling", "Karate"],
      answer: 2,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "In what year was the first UFC event held?",
      options: ["1991", "1993", "1995", "1997"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who won the first ever UFC event (UFC 1) tournament?",
      options: ["Ken Shamrock", "Gerard Gordeau", "Royce Gracie", "Art Jimmerson"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Unified Rules of Mixed Martial Arts'?",
      options: [
        "Rules specific to the UFC only",
        "The standard set of rules adopted by most MMA organizations and athletic commissions",
        "Rules created by the International Olympic Committee for MMA",
        "Training guidelines for MMA gyms",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which fighter holds the record for the longest winning streak in UFC history?",
      options: ["Anderson Silva", "Khabib Nurmagomedov", "Georges St-Pierre", "Kamaru Usman"],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "What is an 'arm triangle choke'?",
      options: [
        "A choke using both the attacker's arm and the defender's own arm to compress the neck",
        "A joint lock applied to both arms simultaneously",
        "An armbar variation done from mount",
        "A submission applied only in the standing position",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "Who is known as 'GSP' and held the UFC welterweight title for many years?",
      options: ["German St-Pierre", "Georges St-Pierre", "Gilbert St-Pierre", "Gaston St-Pierre"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the '10-point must system' used in MMA judging?",
      options: [
        "Each round is scored out of 10 points; the winner of the round gets 10 and the loser 9 or fewer",
        "A fighter must score 10 knockdowns to win",
        "A fighter must accumulate 10 takedowns for a perfect score",
        "The judges award 10 points for each submission attempt",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "Which female fighter was the first UFC Women's Bantamweight Champion?",
      options: ["Amanda Nunes", "Ronda Rousey", "Miesha Tate", "Holly Holm"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What does 'D'arce choke' refer to?",
      options: [
        "A variation of the arm triangle choke applied from the top or while the opponent is in turtle position",
        "A leg submission technique",
        "A standing neck crank",
        "A wrestling pin named after a famous grappler",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "Which UFC event is considered the highest-selling pay-per-view of all time?",
      options: [
        "UFC 229: Khabib vs McGregor",
        "UFC 264: McGregor vs Poirier 3",
        "UFC 202: Diaz vs McGregor 2",
        "UFC 100: Lesnar vs Mir 2",
      ],
      answer: 0,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  BASEBALL (MLB)                                                     */
  /* ------------------------------------------------------------------ */
  baseball: [
    // --- EASY ---
    {
      q: "How many bases are there on a baseball diamond?",
      options: ["3", "4", "5", "6"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many innings are in a standard MLB game?",
      options: ["7", "8", "9", "10"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How many strikes result in a strikeout?",
      options: ["2", "3", "4", "5"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What is a 'home run' in baseball?",
      options: [
        "Running to all bases without stopping",
        "Hitting the ball over the outfield fence in fair territory",
        "Stealing home plate",
        "Hitting a triple",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What does 'MLB' stand for?",
      options: [
        "Major League Baseball",
        "Master League Baseball",
        "Metropolitan League of Baseball",
        "Modern League Baseball",
      ],
      answer: 0,
      difficulty: "easy",
    },
    {
      q: "How many balls result in a walk (base on balls)?",
      options: ["3", "4", "5", "6"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What is the championship series of MLB called?",
      options: ["The Super Bowl", "The World Series", "The Grand Finals", "The Championship"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many outs does the batting team need to accumulate before their half of the inning is over?",
      options: ["2", "3", "4", "5"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What position does the player who throws the ball to the batter play?",
      options: ["Catcher", "Shortstop", "Pitcher", "First baseman"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which MLB team is known as the 'Bronx Bombers'?",
      options: ["Boston Red Sox", "New York Mets", "New York Yankees", "Chicago Cubs"],
      answer: 2,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "Who holds the MLB record for most career home runs with 762?",
      options: ["Babe Ruth", "Hank Aaron", "Barry Bonds", "Alex Rodriguez"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is a 'perfect game' in baseball?",
      options: [
        "A game where every batter gets a hit",
        "A game where a pitcher retires all 27 batters without any reaching base",
        "A game with no errors committed",
        "A game that ends in a shutout",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which player is known as 'The Bambino' and 'The Sultan of Swat'?",
      options: ["Ty Cobb", "Lou Gehrig", "Babe Ruth", "Joe DiMaggio"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the 'designated hitter' (DH) rule?",
      options: [
        "A player who only plays defense",
        "A player who bats in place of the pitcher but does not play defense",
        "A player designated to hit home runs only",
        "A substitute player who enters in the 9th inning",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which Japanese player made headlines as both an elite pitcher and hitter in MLB?",
      options: ["Ichiro Suzuki", "Yu Darvish", "Shohei Ohtani", "Hideki Matsui"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the 'infield fly rule'?",
      options: [
        "A rule preventing bunts with runners on base",
        "An automatic out called on a pop fly in the infield with runners on first and second (or bases loaded) and fewer than 2 outs",
        "A rule requiring outfielders to stay behind a line",
        "A rule about foul balls hit into the infield",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which team broke the famous 'Curse of the Bambino' by winning the 2004 World Series?",
      options: ["Chicago Cubs", "Cleveland Indians", "Boston Red Sox", "Detroit Tigers"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is a 'no-hitter' in baseball?",
      options: [
        "A game where both teams fail to score",
        "A game where the pitcher allows no hits (but may allow baserunners through walks or errors)",
        "A game where the pitcher strikes out every batter",
        "A game decided by home runs only",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "How many players are on the field for the defensive team in baseball?",
      options: ["8", "9", "10", "11"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which player holds the record for the longest hitting streak in MLB history at 56 games?",
      options: ["Pete Rose", "Ted Williams", "Joe DiMaggio", "Ty Cobb"],
      answer: 2,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Who holds the single-season home run record with 73?",
      options: ["Mark McGwire", "Sammy Sosa", "Barry Bonds", "Babe Ruth"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Cy Young Award' given for?",
      options: [
        "Best overall player in MLB",
        "Best pitcher in each league",
        "Most home runs in a season",
        "Best defensive player",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which pitcher holds the record for the most career strikeouts in MLB history?",
      options: ["Roger Clemens", "Randy Johnson", "Nolan Ryan", "Greg Maddux"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is a 'balk' in baseball?",
      options: [
        "When a batter refuses to enter the batter's box",
        "An illegal motion by the pitcher that deceives the runners, resulting in all runners advancing one base",
        "When a fielder drops a routine fly ball",
        "When a runner leaves the baseline",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which team won 116 games in the 2001 regular season, tying the all-time record?",
      options: ["New York Yankees", "Atlanta Braves", "Seattle Mariners", "Boston Red Sox"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Triple Crown' in baseball batting?",
      options: [
        "Leading the league in wins, strikeouts, and ERA",
        "Leading the league in batting average, home runs, and RBIs",
        "Hitting a single, double, and triple in one game",
        "Winning the MVP, Gold Glove, and Silver Slugger in one season",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who was the last MLB player to hit .400 in a season?",
      options: ["Ty Cobb (1911)", "George Brett (1980)", "Ted Williams (1941)", "Tony Gwynn (1994)"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "How many career hits did Pete Rose accumulate to set the all-time record?",
      options: ["4,056", "4,189", "4,256", "4,312"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is 'WAR' in baseball statistics?",
      options: [
        "Win-Against Record",
        "Wins Above Replacement - a metric estimating a player's total value over a replacement-level player",
        "Weighted Average Runs",
        "Walk and Run ratio",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which franchise has won the most World Series titles?",
      options: ["St. Louis Cardinals", "Boston Red Sox", "New York Yankees", "Los Angeles Dodgers"],
      answer: 2,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  GOLF                                                               */
  /* ------------------------------------------------------------------ */
  golf: [
    // --- EASY ---
    {
      q: "How many holes are in a standard round of golf?",
      options: ["9", "12", "18", "21"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is 'par' in golf?",
      options: [
        "The maximum number of strokes allowed",
        "The expected number of strokes for a skilled golfer to complete a hole",
        "The minimum score possible",
        "A penalty stroke",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What is it called when a golfer completes a hole in one stroke under par?",
      options: ["Eagle", "Albatross", "Birdie", "Bogey"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is it called when a golfer completes a hole in one stroke over par?",
      options: ["Birdie", "Bogey", "Double bogey", "Eagle"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which golfer is widely regarded as the greatest of all time with 18 major championships?",
      options: ["Tiger Woods", "Arnold Palmer", "Jack Nicklaus", "Gary Player"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is a 'tee' in golf?",
      options: [
        "The green around the hole",
        "A small peg used to elevate the ball for the first shot on each hole",
        "A type of golf club",
        "The flagstick on the green",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many major championships are there in men's professional golf each year?",
      options: ["2", "3", "4", "5"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "Which major is played at Augusta National Golf Club every year?",
      options: ["The Open Championship", "US Open", "PGA Championship", "The Masters"],
      answer: 3,
      difficulty: "easy",
    },
    {
      q: "In golf, is a lower or higher score better?",
      options: ["Lower", "Higher", "It depends on the format", "They are equal"],
      answer: 0,
      difficulty: "easy",
    },
    {
      q: "What is a 'hole-in-one'?",
      options: [
        "Making the ball into the hole with a single stroke from the tee",
        "Winning a hole by one stroke",
        "A birdie on a par 3",
        "Getting the ball within one foot of the hole",
      ],
      answer: 0,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "How many major championships has Tiger Woods won?",
      options: ["12", "14", "15", "18"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is an 'eagle' in golf?",
      options: [
        "One stroke under par",
        "Two strokes under par",
        "Three strokes under par",
        "A hole-in-one on a par 4",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is an 'albatross' (or 'double eagle') in golf?",
      options: [
        "One stroke under par",
        "Two strokes under par",
        "Three strokes under par",
        "Four strokes under par",
      ],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the Ryder Cup?",
      options: [
        "A tournament for individual golfers",
        "A biennial team competition between Europe and the United States",
        "The trophy awarded at The Masters",
        "A senior golf tour event",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What are the four men's major golf championships?",
      options: [
        "The Masters, US Open, The Open Championship, PGA Championship",
        "The Masters, US Open, Players Championship, PGA Championship",
        "The Masters, US Open, Ryder Cup, PGA Championship",
        "The Masters, FedEx Cup, The Open Championship, PGA Championship",
      ],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "What is a 'handicap' in golf?",
      options: [
        "A penalty for hitting the ball out of bounds",
        "A numerical measure of a golfer's ability that allows players of different skill levels to compete fairly",
        "The maximum number of clubs allowed in a bag",
        "A type of golf course layout",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is the maximum number of clubs a golfer can carry in their bag during a round?",
      options: ["10", "12", "14", "16"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Which country does Rory McIlroy represent?",
      options: ["England", "Scotland", "Northern Ireland", "Republic of Ireland"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is a 'links course'?",
      options: [
        "Any golf course with 18 holes",
        "A coastal course on sandy, treeless terrain often found in the British Isles",
        "A course designed for beginners",
        "A course with water hazards on every hole",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is the FedEx Cup?",
      options: [
        "A one-day exhibition match",
        "The season-long points competition on the PGA Tour culminating in a playoff series",
        "An international team event",
        "A charity tournament",
      ],
      answer: 1,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "Who is the only golfer to win the career 'Grand Slam' three times (all four majors at least three times each)?",
      options: ["Tiger Woods", "Jack Nicklaus", "Ben Hogan", "Gary Player"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is a 'condor' in golf?",
      options: [
        "One stroke under par",
        "Two strokes under par",
        "Three strokes under par",
        "Four strokes under par (e.g., a hole-in-one on a par 5)",
      ],
      answer: 3,
      difficulty: "hard",
    },
    {
      q: "Which golfer won The Masters wearing a green jacket for the first time in 1997 at age 21?",
      options: ["Phil Mickelson", "Ernie Els", "Tiger Woods", "Vijay Singh"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is 'stableford scoring' in golf?",
      options: [
        "A scoring system where points are awarded based on the number of strokes taken at each hole relative to par",
        "A sudden-death playoff format",
        "A match play scoring method",
        "The official scoring system for all PGA events",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "Which golfer has the most PGA Tour wins of all time?",
      options: ["Jack Nicklaus", "Tiger Woods", "Sam Snead", "Ben Hogan"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'Green Jacket' and which tournament awards it?",
      options: [
        "The trophy of the US Open",
        "A jacket worn by Augusta National members, awarded to The Masters winner",
        "The team uniform for the Ryder Cup",
        "A prize given at The Open Championship",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is a 'bump and run' shot in golf?",
      options: [
        "A high lofted shot over a bunker",
        "A low, running approach shot that bounces and rolls toward the hole",
        "A long drive that bounces off the fairway",
        "A putt from off the green",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Who won five consecutive Open Championships from 2006 to 2010?",
      options: [
        "No one has achieved this",
        "Tiger Woods",
        "Padraig Harrington",
        "Phil Mickelson",
      ],
      answer: 0,
      difficulty: "hard",
    },
    {
      q: "What is the lowest 72-hole score in relation to par ever recorded at a major championship?",
      options: [
        "18 under par",
        "20 under par",
        "23 under par",
        "25 under par",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "In match play, what does 'dormie' mean?",
      options: [
        "The match is tied after 18 holes",
        "A player is up by as many holes as remain, meaning they cannot lose in regulation",
        "Both players have made birdie",
        "The match has been conceded",
      ],
      answer: 1,
      difficulty: "hard",
    },
  ],

  /* ------------------------------------------------------------------ */
  /*  HOCKEY (NHL)                                                       */
  /* ------------------------------------------------------------------ */
  hockey: [
    // --- EASY ---
    {
      q: "How many players from each team are on the ice during regular play (including the goalie)?",
      options: ["5", "6", "7", "8"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "How many periods are in a standard NHL game?",
      options: ["2", "3", "4", "5"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What is the trophy awarded to the NHL champion called?",
      options: ["Larry O'Brien Trophy", "Vince Lombardi Trophy", "Stanley Cup", "Commissioner's Trophy"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What is it called when a player scores three goals in a single game?",
      options: ["Triple play", "Hat trick", "Three-peat", "Trifecta"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What is the flat rubber disc used in hockey called?",
      options: ["Ball", "Disc", "Puck", "Biscuit"],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "What happens when a player commits a penalty in hockey?",
      options: [
        "They receive a yellow card",
        "They are sent to the penalty box for a set amount of time",
        "The other team gets a free shot",
        "They are ejected from the game",
      ],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "Which country is ice hockey's NHL based in?",
      options: [
        "United States only",
        "Canada only",
        "Both United States and Canada",
        "Multiple countries worldwide",
      ],
      answer: 2,
      difficulty: "easy",
    },
    {
      q: "How long is each period in an NHL game?",
      options: ["15 minutes", "20 minutes", "25 minutes", "30 minutes"],
      answer: 1,
      difficulty: "easy",
    },
    {
      q: "What is a 'power play' in hockey?",
      options: [
        "When a team has more players on the ice due to the opponent's penalty",
        "A special overtime period",
        "A type of goal scored from center ice",
        "A face-off in the offensive zone",
      ],
      answer: 0,
      difficulty: "easy",
    },
    {
      q: "Which team has won the most Stanley Cup championships?",
      options: ["Toronto Maple Leafs", "Detroit Red Wings", "Boston Bruins", "Montreal Canadiens"],
      answer: 3,
      difficulty: "easy",
    },
    // --- MEDIUM ---
    {
      q: "Who holds the record for the most career goals in NHL history?",
      options: ["Mario Lemieux", "Gordie Howe", "Wayne Gretzky", "Alexander Ovechkin"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is an 'assist' in hockey?",
      options: [
        "Blocking a shot",
        "A pass or play that directly leads to a teammate scoring a goal (up to two per goal)",
        "Winning a face-off",
        "A defensive play preventing a goal",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What is a 'Zamboni'?",
      options: [
        "A type of hockey stick",
        "A special hockey formation",
        "An ice resurfacing machine used between periods",
        "A defensive zone play",
      ],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "Who is known as 'The Great One'?",
      options: ["Bobby Orr", "Mario Lemieux", "Wayne Gretzky", "Gordie Howe"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is 'icing' in hockey?",
      options: [
        "When a team shoots the puck from behind center ice past the opposing goal line without it being touched",
        "When a player uses excessive force",
        "When the ice is too slippery to play on",
        "When a goaltender freezes the puck",
      ],
      answer: 0,
      difficulty: "medium",
    },
    {
      q: "What is the standard penalty duration for a minor penalty in the NHL?",
      options: ["1 minute", "2 minutes", "3 minutes", "5 minutes"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Which trophy is awarded to the NHL's Most Valuable Player each season?",
      options: ["Vezina Trophy", "Norris Trophy", "Hart Memorial Trophy", "Calder Trophy"],
      answer: 2,
      difficulty: "medium",
    },
    {
      q: "What is the 'crease' in hockey?",
      options: [
        "The center ice circle",
        "The painted area directly in front of the goal where the goaltender operates",
        "The line at center ice",
        "The penalty box area",
      ],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "Who is the youngest captain to lead his team to a Stanley Cup victory?",
      options: ["Wayne Gretzky", "Sidney Crosby", "Steve Yzerman", "Connor McDavid"],
      answer: 1,
      difficulty: "medium",
    },
    {
      q: "What overtime format does the NHL use during the regular season?",
      options: [
        "5-minute sudden-death 3-on-3, followed by a shootout if still tied",
        "10-minute sudden-death 5-on-5",
        "Continuous overtime until a goal is scored",
        "Penalty shots immediately after regulation",
      ],
      answer: 0,
      difficulty: "medium",
    },
    // --- HARD ---
    {
      q: "How many career points (goals + assists) did Wayne Gretzky accumulate?",
      options: ["2,457", "2,857", "2,657", "3,057"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which player scored 'The Goal' for Canada in the 2010 Winter Olympics gold medal game?",
      options: ["Wayne Gretzky", "Sidney Crosby", "Jarome Iginla", "Jonathan Toews"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the 'Gordie Howe hat trick'?",
      options: [
        "Scoring four goals in one game",
        "A goal, an assist, and a fight in the same game",
        "Three goals in the third period",
        "Scoring the game-winning goal in overtime",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which NHL player holds the record for most goals in a single season with 92?",
      options: ["Mario Lemieux", "Wayne Gretzky", "Brett Hull", "Alexander Ovechkin"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the 'Conn Smythe Trophy' awarded for?",
      options: [
        "Best regular season player",
        "Most Valuable Player of the NHL playoffs",
        "Best goaltender in the regular season",
        "Best defenseman",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What happened in the 2004-05 NHL season?",
      options: [
        "The Montreal Canadiens won their 25th Cup",
        "The entire season was cancelled due to a lockout",
        "A new expansion team was added",
        "The overtime rules were changed to 3-on-3",
      ],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which defenseman is widely considered the greatest of all time?",
      options: ["Nicklas Lidstrom", "Bobby Orr", "Chris Chelios", "Ray Bourque"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "What is the fastest recorded slap shot in NHL history (approximately)?",
      options: ["95 mph", "100 mph", "108.8 mph", "115 mph"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "Connor McDavid is the captain of which NHL team?",
      options: ["Toronto Maple Leafs", "Edmonton Oilers", "Pittsburgh Penguins", "Colorado Avalanche"],
      answer: 1,
      difficulty: "hard",
    },
    {
      q: "Which team has the longest Stanley Cup drought, not winning since 1967?",
      options: ["Buffalo Sabres", "Vancouver Canucks", "Toronto Maple Leafs", "St. Louis Blues"],
      answer: 2,
      difficulty: "hard",
    },
    {
      q: "What is the 'offsides' rule in hockey?",
      options: [
        "A player from the attacking team enters the offensive zone before the puck",
        "A player is behind the goal line during a face-off",
        "A player shoots from behind the center line",
        "A goaltender crosses the center line",
      ],
      answer: 0,
      difficulty: "hard",
    },
  ],
};
