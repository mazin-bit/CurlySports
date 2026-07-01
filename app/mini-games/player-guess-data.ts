export interface PlayerGuess {
  clues: string[];
  answer: string;
}

export const PLAYER_GUESSES: Record<string, PlayerGuess[]> = {
  football: [
    {
      clues: [
        "Was diagnosed with a growth hormone deficiency at age 11 and moved overseas for treatment funded by his future club",
        "Holds the record for most Ballon d'Or awards in history with eight",
        "Wore the number 10 shirt at Barcelona for over a decade",
        "Argentine forward who won the 2022 FIFA World Cup in Qatar",
      ],
      answer: "Lionel Messi",
    },
    {
      clues: [
        "Grew up in a poor neighborhood on the island of Madeira and was mocked for his accent at Sporting's academy",
        "Has scored over 900 career goals across club and international football",
        "Famous for his mid-air hang time and powerful free kicks",
        "Portuguese legend who starred at Manchester United, Real Madrid, and Juventus",
      ],
      answer: "Cristiano Ronaldo",
    },
    {
      clues: [
        "Joined a top European academy at age 11 after relocating from the suburbs of Paris",
        "Became the second teenager after Pele to score in a World Cup final",
        "Known for his explosive pace, often clocked among the fastest in world football",
        "French striker who led France to the 2018 World Cup title and moved to Real Madrid in 2024",
      ],
      answer: "Kylian Mbappe",
    },
    {
      clues: [
        "Son of former Leeds United and Manchester City striker Alf-Inge, who retired due to a career-ending tackle",
        "Became the youngest player to score in five consecutive Champions League matches",
        "Known for his meditation routine and ultra-disciplined lifestyle off the pitch",
        "Norwegian goal machine who joined Manchester City and broke the Premier League scoring record",
      ],
      answer: "Erling Haaland",
    },
    {
      clues: [
        "Grew up in the Mogi das Cruzes favela and was discovered playing futsal as a young boy",
        "Became the most expensive transfer in history when he moved to PSG for 222 million euros in 2017",
        "Famous for his flair, stepovers, and rainbow flicks",
        "Brazilian superstar who formed the iconic MSN trio with Messi and Suarez at Barcelona",
      ],
      answer: "Neymar",
    },
    {
      clues: [
        "Born in Marseille to Algerian immigrant parents and spent part of his youth in La Castellane",
        "Won the World Cup, European Championship, and Champions League in consecutive years (1998-2002)",
        "Infamously headbutted Marco Materazzi in the 2006 World Cup final",
        "French midfield maestro who wore the number 5 shirt at Real Madrid and Juventus",
      ],
      answer: "Zinedine Zidane",
    },
    {
      clues: [
        "Grew up in poverty in Porto Alegre and learned his tricks playing street football barefoot",
        "Won the FIFA World Player of the Year award twice, in 2004 and 2005",
        "Known for his joyful playing style, toothy smile, and elaborate celebrations",
        "Brazilian magician who enchanted fans at Barcelona with his dribbling and no-look passes",
      ],
      answer: "Ronaldinho",
    },
    {
      clues: [
        "Was loaned out by Manchester United to Preston North End at age 19 before breaking into the first team",
        "Scored a famous halfway-line goal on the opening day of the 1996-97 Premier League season",
        "Married a former Spice Girl and became one of the most recognized athletes on the planet",
        "English midfielder famous for his pinpoint crosses and free kicks who played for Man Utd, Real Madrid, and LA Galaxy",
      ],
      answer: "David Beckham",
    },
    {
      clues: [
        "Grew up in Villa Fiorito, one of the poorest barrios in Buenos Aires, and played for Argentinos Juniors as a teenager",
        "Scored the infamous 'Hand of God' goal and the 'Goal of the Century' in the same 1986 World Cup match",
        "Led Napoli to their first-ever Serie A title in 1987",
        "Argentine legend widely considered one of the two greatest players ever, wore the number 10 for Argentina",
      ],
      answer: "Diego Maradona",
    },
    {
      clues: [
        "Made his professional debut at age 15 for Santos and scored a hat trick in his first full match",
        "Holds the Guinness World Record for most career goals scored by a professional footballer",
        "Won three FIFA World Cups with Brazil in 1958, 1962, and 1970",
        "Known simply as 'The King of Football,' widely regarded as the greatest player in history",
      ],
      answer: "Pele",
    },
    {
      clues: [
        "Was rejected by Legia Warsaw's academy as a teenager before joining Znicz Pruszkow in the Polish lower divisions",
        "Has won the European Golden Shoe award on multiple occasions across different leagues",
        "Known for his clinical finishing and positioning inside the box",
        "Polish striker who scored over 300 goals for Bayern Munich before moving to Barcelona",
      ],
      answer: "Robert Lewandowski",
    },
    {
      clues: [
        "Grew up in Nagrig, a small village in Egypt, and was spotted by the Egyptian youth system at a young age",
        "Became the first Egyptian player to win the Premier League Golden Boot",
        "Famous for cutting inside from the right wing onto his lethal left foot",
        "Egyptian winger nicknamed 'The Egyptian King' who became a Liverpool legend",
      ],
      answer: "Mohamed Salah",
    },
  ],

  cricket: [
    {
      clues: [
        "Made his ODI debut at 19 against Sri Lanka in 2008 and scored just 12 runs",
        "Holds the record for fastest century by an Indian captain in ODI cricket",
        "Known for his aggressive chase-master batting and passionate celebrations",
        "Indian batting icon who captained Royal Challengers Bangalore in the IPL for years and wears number 18",
      ],
      answer: "Virat Kohli",
    },
    {
      clues: [
        "Was originally a goalkeeper in football before being sent to cricket practice by his coach",
        "Became the youngest captain to win the ICC Cricket World Cup in 2011, at age 29",
        "Famous for his lightning-fast stumpings and 'helicopter shot'",
        "Indian wicketkeeper-batsman known as 'Captain Cool' who led CSK to multiple IPL titles",
      ],
      answer: "MS Dhoni",
    },
    {
      clues: [
        "Was selected for the Indian team at age 16 after scoring a record 664 runs in a school partnership",
        "Holds the record for the most international centuries in cricket history with 100 tons",
        "Known as the 'God of Cricket' in India",
        "Indian batting legend who played 24 years of international cricket and retired in 2013 at his home ground Wankhede Stadium",
      ],
      answer: "Sachin Tendulkar",
    },
    {
      clues: [
        "Grew up in Ahmedabad and initially bowled with a side-arm action before remodeling it",
        "Took a hat-trick in a T20 international and was the leading wicket-taker in the 2019 World Cup",
        "Famous for his unplayable yorkers and lethal slower-ball bouncers at the death",
        "Indian fast bowler who became the number one ranked ODI and Test bowler, known for his unique release point",
      ],
      answer: "Jasprit Bumrah",
    },
    {
      clues: [
        "Made his first-class debut at 18 for Islamabad and averaged over 60 in his debut domestic season",
        "Became the fastest Pakistani to reach 1,000 T20I runs",
        "Known for his elegant cover drives and wristy flicks, often compared to Virat Kohli",
        "Pakistani batting star and former captain who plays for the Lahore Qalandars in the PSL",
      ],
      answer: "Babar Azam",
    },
    {
      clues: [
        "Was initially a leg-spinner in club cricket before focusing on batting in his late teens",
        "Scored 239 in the 2019 Ashes at Headingley in one of the greatest Test innings ever",
        "Known for his unorthodox 'fidgety' technique at the crease and ability to bat for long periods",
        "Australian batsman nicknamed 'Smudge' who was involved in the 2018 ball-tampering scandal",
      ],
      answer: "Steve Smith",
    },
    {
      clues: [
        "Was originally a pure fast bowler who batted at number 11 early in his career",
        "Hit the winning runs in the 2019 World Cup final at Lord's, one of the greatest matches in cricket history",
        "Famous for his aggressive all-round play and fiery competitiveness on the field",
        "English all-rounder who captained England to a famous 2022 T20 World Cup victory",
      ],
      answer: "Ben Stokes",
    },
    {
      clues: [
        "Grew up in Tauranga, New Zealand, and played age-group cricket alongside the late Martin Crowe's guidance",
        "Scored over 7,000 Test runs at an average above 54 for New Zealand",
        "Known for his elegant and technically correct batting style, often called the 'quiet achiever'",
        "New Zealand captain who led the Black Caps to consecutive World Cup finals in 2015 and 2019",
      ],
      answer: "Kane Williamson",
    },
    {
      clues: [
        "Originally played as a wicketkeeper but transitioned to a specialist batsman mid-career",
        "Holds the record for the fastest century in ODI history, reaching 100 off just 31 balls",
        "Known as 'Mr. 360' for his ability to hit the ball to any part of the ground",
        "South African batting genius who retired from international cricket in 2018 at age 34 to focus on T20 leagues",
      ],
      answer: "AB de Villiers",
    },
    {
      clues: [
        "Born in a small hospital in Santa Cruz, Trinidad, and showed prodigious talent by age 14",
        "Scored 501 not out in a first-class match for Warwickshire in 1994, a world record at the time",
        "Famous for his commanding pull shots and ability to dominate any bowling attack",
        "West Indian batting legend who held the record for the highest individual Test score of 400 not out",
      ],
      answer: "Brian Lara",
    },
    {
      clues: [
        "Was born in Lahore and initially wanted to be a fast bowler before focusing on leg-spin",
        "Took 708 Test wickets, the most by any leg-spinner in cricket history",
        "Known as the 'Sultan of Spin' and for his famous 'Ball of the Century' to Mike Gatting in 1993",
        "Australian leg-spin legend who revolutionized spin bowling and was a key figure in Australia's dominance in the 1990s-2000s",
      ],
      answer: "Shane Warne",
    },
  ],

  basketball: [
    {
      clues: [
        "Was not the highest-rated recruit in his high school class and considered attending several colleges before going straight to the NBA",
        "Is the NBA's all-time leading scorer, surpassing Kareem Abdul-Jabbar's long-standing record in 2023",
        "Has played in 10 NBA Finals and won four championships with three different teams",
        "Known as 'King James,' this forward played for Cleveland, Miami, and the Los Angeles Lakers",
      ],
      answer: "LeBron James",
    },
    {
      clues: [
        "Was lightly recruited in high school and played college basketball at Davidson, a small mid-major school",
        "Holds the NBA record for most three-pointers made in a career and in a single season (402 in 2015-16)",
        "Famous for his 'night night' celebration and deep three-pointers from well beyond the arc",
        "Golden State Warriors guard who won four NBA championships and changed the way basketball is played",
      ],
      answer: "Stephen Curry",
    },
    {
      clues: [
        "Grew up in Sombor, Serbia, and was a promising horse jockey before choosing basketball",
        "Won three consecutive NBA MVP awards from 2021 to 2024",
        "Known for his exceptional passing ability as a center, often recording triple-doubles",
        "Denver Nuggets big man who led the team to their first NBA championship in 2023",
      ],
      answer: "Nikola Jokic",
    },
    {
      clues: [
        "Attended the University of Texas for one year and was drafted second overall in 2007",
        "Has scored over 28,000 career points and is one of the most efficient scorers in NBA history",
        "Known for his 7-foot frame combined with guard-like shooting ability and his pull-up midrange jumper",
        "Superstar forward nicknamed 'KD' who played for OKC, Golden State, Brooklyn, and Phoenix",
      ],
      answer: "Kevin Durant",
    },
    {
      clues: [
        "Moved from Athens, Greece to join the NBA without playing college basketball and was drafted 15th overall in 2013",
        "Won two consecutive NBA MVP awards in 2019 and 2020 and the 2021 NBA championship",
        "Known as the 'Greek Freak' for his unique combination of size, speed, and ball-handling",
        "Milwaukee Bucks forward who scored 50 points in the clinching game of the 2021 NBA Finals",
      ],
      answer: "Giannis Antetokounmpo",
    },
    {
      clues: [
        "Was famously cut from his high school varsity basketball team as a sophomore",
        "Won six NBA championships and earned six Finals MVP awards, never losing in the Finals",
        "Known for his fierce competitiveness, tongue-out drives, and the Air Jordan brand",
        "Chicago Bulls legend widely considered the greatest basketball player of all time",
      ],
      answer: "Michael Jordan",
    },
    {
      clues: [
        "Entered the NBA straight out of Lower Merion High School in 1996 as the 13th overall pick",
        "Won five NBA championships with the same franchise, all alongside Shaquille O'Neal or Pau Gasol",
        "Known as the 'Black Mamba' and for his relentless 'Mamba Mentality' work ethic",
        "Lakers legend who scored 81 points in a single game and 60 points in his final career game",
      ],
      answer: "Kobe Bryant",
    },
    {
      clues: [
        "Grew up in Newark, New Jersey, and attended LSU, where he led the Tigers deep into the NCAA tournament",
        "Won three NBA Finals MVP awards and one regular season MVP during his career",
        "Known for his dominant size at 7'1\" and 325 pounds, combined with surprising agility",
        "Legendary center nicknamed 'Shaq' who dominated with the Lakers and famously feuded with Kobe Bryant",
      ],
      answer: "Shaquille O'Neal",
    },
    {
      clues: [
        "Grew up in the U.S. Virgin Islands before moving to the mainland and attending Wake Forest University",
        "Won five NBA championships in a span of nine years, all with the same franchise",
        "Known as 'The Big Fundamental' for his bank shots, footwork, and fundamental basketball skills",
        "San Antonio Spurs power forward who is considered the greatest power forward in NBA history",
      ],
      answer: "Tim Duncan",
    },
    {
      clues: [
        "Was drafted first overall in 1979 and immediately turned around a franchise that had won just 29 games the prior year",
        "Recorded a triple-double in the NBA Finals as a rookie, playing center in Game 6 after Kareem's injury",
        "Known for his no-look passes and showtime playing style",
        "Lakers legend who led the 'Showtime' era and had a famous rivalry with Larry Bird",
      ],
      answer: "Magic Johnson",
    },
    {
      clues: [
        "Grew up in Englewood, Chicago, one of the city's toughest neighborhoods, and was the top recruit in the nation at Simeon High School",
        "Became the youngest NBA MVP in history at age 22 in 2011",
        "Known for his explosive athleticism, acrobatic layups, and dramatic comeback from multiple knee injuries",
        "Chicago Bulls point guard whose career was derailed by injuries but who remains one of the most beloved players of his generation",
      ],
      answer: "Derrick Rose",
    },
  ],

  f1: [
    {
      clues: [
        "Started karting at age four after his father built him a custom kart, and won his first championship at eight",
        "Became the youngest ever F1 race winner at age 18 at the 2016 Spanish Grand Prix",
        "Won four consecutive World Drivers' Championships from 2021 to 2024",
        "Red Bull Racing's Dutch driver who dominated the turbo-hybrid era with record-breaking season wins",
      ],
      answer: "Max Verstappen",
    },
    {
      clues: [
        "Grew up in Stevenage, England, and was one of the few Black drivers in karting history",
        "Holds the record for most pole positions in Formula 1 history",
        "Won seven World Drivers' Championships, tying Michael Schumacher's record",
        "British driver who moved from Mercedes to Ferrari in 2025 after a historic run of dominance",
      ],
      answer: "Lewis Hamilton",
    },
    {
      clues: [
        "Born in Sao Paulo, Brazil, and was so talented in karting that he won multiple South American championships as a teenager",
        "Won three consecutive World Drivers' Championships from 1988 to 1991 with McLaren",
        "Famous for his extraordinary performances in wet conditions, particularly at Monaco and Donington Park",
        "Brazilian legend who tragically died at the 1994 San Marino Grand Prix at Imola",
      ],
      answer: "Ayrton Senna",
    },
    {
      clues: [
        "Began racing karts at age four in Kerpen, Germany, and won the German and European junior karting championships",
        "Holds the record for most consecutive World Championships with five straight from 2000 to 2004",
        "Was known for his meticulous approach to car setup and fitness, revolutionizing driver preparation",
        "German driver who won seven World Drivers' Championships, mainly with Ferrari, before a tragic skiing accident in 2013",
      ],
      answer: "Michael Schumacher",
    },
    {
      clues: [
        "Is the son of a former F1 driver and grandson of a three-time world rally champion from Monaco",
        "Won his first Grand Prix at the 2019 Belgian GP and has been a consistent front-runner for Ferrari",
        "Known for his smooth qualifying pace and raw speed on street circuits",
        "Monegasque Ferrari driver who has been the team's lead driver since 2022",
      ],
      answer: "Charles Leclerc",
    },
    {
      clues: [
        "His father is a retired pension fund manager turned motorsport investor, and Lando earned his seat through dominant junior formula results including the F3 championship",
        "Won his first Grand Prix at the 2024 Miami Grand Prix after years of near-misses",
        "Known for his entertaining personality, streaming, and close friendship with Max Verstappen",
        "British McLaren driver who emerged as a championship contender in 2024 and 2025",
      ],
      answer: "Lando Norris",
    },
    {
      clues: [
        "Made his F1 debut at age 19 with Minardi in 2001, making him the youngest race starter at the time",
        "Won two World Drivers' Championships with Renault in 2005 and 2006",
        "Famous for his racecraft, defensive driving, and longevity, still racing into his 40s",
        "Spanish driver nicknamed 'El Plan' by fans who drove for nearly every top team during his 20+ year career",
      ],
      answer: "Fernando Alonso",
    },
    {
      clues: [
        "Grew up in Heppenheim, Germany, and idolized Michael Schumacher as a child",
        "Won four consecutive World Drivers' Championships from 2010 to 2013 with Red Bull Racing",
        "Known for naming each of his cars (e.g., 'Luscious Liz') and his finger-wagging celebration",
        "German driver who later moved to Ferrari and Aston Martin before retiring from F1 in 2022",
      ],
      answer: "Sebastian Vettel",
    },
    {
      clues: [
        "Suffered severe burns in the 1976 German Grand Prix at the Nurburgring and returned to racing just six weeks later",
        "Won three World Drivers' Championships in 1975, 1977, and 1984",
        "Known for his analytical approach to racing and his famous rivalry with James Hunt",
        "Austrian legend whose courage and determination were portrayed in the 2013 film 'Rush'",
      ],
      answer: "Niki Lauda",
    },
    {
      clues: [
        "Born in Saint-Chamond, France, and studied at a prestigious engineering school before entering racing",
        "Won four World Drivers' Championships in 1985, 1986, 1989, and 1993",
        "Known as 'The Professor' for his cerebral approach to racing and tire management",
        "French driver famous for his intense rivalry with Ayrton Senna at McLaren in the late 1980s",
      ],
      answer: "Alain Prost",
    },
    {
      clues: [
        "Grew up in Perth, Western Australia, with Italian heritage and moved to Europe as a teenager to pursue racing",
        "Won eight Grand Prix victories and famously outscored his four-time champion teammate Sebastian Vettel at Red Bull in 2014",
        "Known for his trademark 'shoey' celebration -- drinking champagne from his racing boot on the podium",
        "Australian driver famous for his megawatt smile who raced for Red Bull, Renault, and McLaren before returning to the Red Bull family",
      ],
      answer: "Daniel Ricciardo",
    },
  ],

  nfl: [
    {
      clues: [
        "Was a three-sport athlete in high school in Tyler, Texas, excelling in football, basketball, and baseball",
        "Won three Super Bowls and three MVP awards before his 29th birthday",
        "Known for his no-look passes and ability to improvise under pressure",
        "Kansas City Chiefs quarterback who married his high school sweetheart Brittany and has dominated the NFL since 2018",
      ],
      answer: "Patrick Mahomes",
    },
    {
      clues: [
        "Was drafted 199th overall in the sixth round of the 2000 NFL Draft, famously overlooked by every team",
        "Won seven Super Bowls, more than any other player in NFL history",
        "Known for his meticulous preparation, strict TB12 diet, and longevity playing until age 45",
        "New England Patriots and Tampa Bay Buccaneers quarterback widely considered the GOAT of football",
      ],
      answer: "Tom Brady",
    },
    {
      clues: [
        "Attended the University of California, Berkeley before being drafted 24th overall in 2005",
        "Won four NFL MVP awards, tied for the most in league history",
        "Famous for his Hail Mary passes and 'I own you' taunt to Bears fans at Soldier Field",
        "Green Bay Packers legend and longtime starting quarterback who later played for the Jets",
      ],
      answer: "Aaron Rodgers",
    },
    {
      clues: [
        "Grew up in Monongahela, Pennsylvania, and played at Notre Dame before being selected in the third round",
        "Led the greatest Super Bowl comeback in history at the time, rallying from 16 down against the Bengals in Super Bowl XXIII",
        "Won four Super Bowls with a perfect 4-0 record and earned three Super Bowl MVP awards",
        "San Francisco 49ers quarterback of the 1980s dynasty who redefined the West Coast offense",
      ],
      answer: "Joe Montana",
    },
    {
      clues: [
        "Was a track and football star at Mississippi Valley State, a small Division I-AA school",
        "Holds the NFL record for most career receiving yards (22,895) and receiving touchdowns (197)",
        "Known for his meticulous route-running, incredible hands, and tireless work ethic",
        "San Francisco 49ers wide receiver often called the greatest football player at his position ever",
      ],
      answer: "Jerry Rice",
    },
    {
      clues: [
        "Was the second overall pick in the 1981 NFL Draft out of the University of North Carolina",
        "Won three Defensive Player of the Year awards and changed the way the outside linebacker position was played",
        "Known for his terrifying speed off the edge and his ability to single-handedly alter game plans",
        "New York Giants legend nicknamed 'LT' who is widely considered the greatest defensive player in NFL history",
      ],
      answer: "Lawrence Taylor",
    },
    {
      clues: [
        "Is the son of former NFL quarterback Archie Manning and brother of two-time Super Bowl champion Eli Manning",
        "Won five NFL MVP awards, the most in league history at the time of his retirement",
        "Known for his pre-snap audibles, 'Omaha' cadence, and cerebral approach to the game",
        "Quarterback who won Super Bowls with both the Indianapolis Colts and Denver Broncos",
      ],
      answer: "Peyton Manning",
    },
    {
      clues: [
        "Was the third overall pick in the 1989 Draft out of Oklahoma State University",
        "Rushed for over 2,000 yards in 1997, only the third player in NFL history to do so at the time",
        "Known for his elusive running style and jaw-dropping jukes that left defenders grasping at air",
        "Detroit Lions running back who shocked the world by retiring at age 30 while still in his prime",
      ],
      answer: "Barry Sanders",
    },
    {
      clues: [
        "Won the Heisman Trophy at the University of Louisville as a sophomore in 2016",
        "Became the youngest quarterback to win the NFL MVP award and the first unanimous MVP at the time",
        "Known for his electrifying dual-threat ability, combining elite passing with record-breaking rushing for a QB",
        "Baltimore Ravens quarterback who won back-to-back MVP awards in 2019 and 2024",
      ],
      answer: "Lamar Jackson",
    },
    {
      clues: [
        "Played at the University of Wyoming, not a traditional football powerhouse, before being drafted seventh overall in 2018",
        "Has one of the strongest arms in NFL history, capable of throwing the ball over 70 yards with ease",
        "Known for his toughness in cold-weather games and his imposing 6'5\" frame",
        "Buffalo Bills quarterback who has led the team to multiple playoff runs in the 2020s",
      ],
      answer: "Josh Allen",
    },
    {
      clues: [
        "Played college football at the University of Michigan and was drafted by the San Diego Chargers in 2004",
        "Holds the NFL record for career passing yards and passing touchdowns as of his 2024 retirement",
        "Known for his cannon arm, bolo ties on game day, and leadership on and off the field",
        "Longtime Chargers and later Colts quarterback who was the 2004 first overall pick alongside Eli Manning",
      ],
      answer: "Philip Rivers",
    },
  ],

  tennis: [
    {
      clues: [
        "Grew up in war-torn Serbia during the 1990s and trained in a swimming pool complex converted into makeshift courts",
        "Holds the all-time record for most Grand Slam singles titles in men's tennis with 24",
        "Known for his incredible flexibility, return of serve, and mental toughness in long rallies",
        "Serbian champion who dominated the Australian Open, winning it a record 10 times",
      ],
      answer: "Novak Djokovic",
    },
    {
      clues: [
        "Was discovered by a tennis scout at age 12 in his hometown of Manacor, Mallorca, and trained at an uncle's academy",
        "Won a record 14 French Open titles between 2005 and 2022",
        "Known as the 'King of Clay' for his heavy topspin forehand and relentless physicality",
        "Spanish left-handed legend who formed the 'Big Three' alongside Federer and Djokovic",
      ],
      answer: "Rafael Nadal",
    },
    {
      clues: [
        "Grew up in Basel, Switzerland, speaking Swiss-German and French, with a South African mother",
        "Won 20 Grand Slam titles and held the world number one ranking for a record 310 weeks",
        "Known for his effortless one-handed backhand and graceful, fluid playing style",
        "Swiss maestro who retired in 2022 after an emotional final match at the Laver Cup",
      ],
      answer: "Roger Federer",
    },
    {
      clues: [
        "Began playing tennis at age four in El Palmar, Murcia, and was coached by former player Juan Carlos Ferrero",
        "Became the youngest year-end world number one in ATP history at age 19",
        "Known for his powerful forehand, drop shots, and maturity beyond his years",
        "Spanish prodigy who won the US Open in 2022 at age 19 and Wimbledon in 2023 at age 20",
      ],
      answer: "Carlos Alcaraz",
    },
    {
      clues: [
        "Began playing at age three in Compton, California, trained by her father Richard on public courts",
        "Won 23 Grand Slam singles titles, the most in the Open Era for any player at the time",
        "Known for her powerful serve, fierce competitiveness, and dominance across all surfaces",
        "American legend who won a 'Serena Slam' by holding all four major titles simultaneously",
      ],
      answer: "Serena Williams",
    },
    {
      clues: [
        "Started playing tennis at age four in Bruhl, West Germany, coached by her father Peter",
        "Won 22 Grand Slam singles titles and completed the Calendar Year Golden Slam in 1988",
        "Known for her powerful forehand, athleticism, and dominance in the late 1980s and early 1990s",
        "German champion who held the number one ranking for a record 377 weeks",
      ],
      answer: "Steffi Graf",
    },
    {
      clues: [
        "Born in Washington, D.C., and grew up in Palos Verdes, California, starting tennis at age seven",
        "Won 14 Grand Slam singles titles and was the first player to win Wimbledon five consecutive times in the Open Era",
        "Known for his serve-and-volley style and powerful flat serve",
        "American player nicknamed 'Pistol Pete' who dominated the men's game in the 1990s",
      ],
      answer: "Pete Sampras",
    },
    {
      clues: [
        "Grew up in Las Vegas and attended the Nick Bollettieri Tennis Academy as a young teenager",
        "Won eight Grand Slam titles and completed a Career Grand Slam in 1999",
        "Known for his flashy style, returning ability, and famous 'image is everything' camera ads",
        "American player recognized by his shaved head, earring, and colorful outfits who married Steffi Graf",
      ],
      answer: "Andre Agassi",
    },
    {
      clues: [
        "Born in Long Beach, California, in 1943 and was a top amateur player before the Open Era",
        "Won 12 Grand Slam singles titles and was instrumental in the founding of the WTA Tour in 1973",
        "Famous for her 1973 'Battle of the Sexes' match against Bobby Riggs at the Houston Astrodome",
        "American tennis pioneer who fought for equal prize money for women in professional tennis",
      ],
      answer: "Billie Jean King",
    },
    {
      clues: [
        "Born in Osaka, Japan, to a Haitian father and Japanese mother, and grew up training in Florida",
        "Won the 2018 US Open at age 20, defeating Serena Williams in a controversial final",
        "Known for her powerful serve, open discussions about mental health, and social activism",
        "Japanese-Haitian player who won four Grand Slam titles before stepping back from the sport",
      ],
      answer: "Naomi Osaka",
    },
    {
      clues: [
        "Grew up in Minsk, Belarus, and began playing tennis at age six, coached by her father until his passing in 2019",
        "Won three Grand Slam singles titles including back-to-back Australian Opens in 2023 and 2024",
        "Known for her powerful ball-striking, booming serve, and aggressive baseline game",
        "Belarusian player who reached world number one and became the dominant force in women's tennis in the mid-2020s",
      ],
      answer: "Aryna Sabalenka",
    },
  ],

  mma: [
    {
      clues: [
        "Was a junior college wrestling national champion in Iowa before transitioning to MMA",
        "Has held titles in two different UFC weight classes -- light heavyweight and heavyweight",
        "Known for his creative striking, spinning elbows, and unorthodox fight IQ",
        "Widely considered the greatest MMA fighter of all time, nicknamed 'Bones'",
      ],
      answer: "Jon Jones",
    },
    {
      clues: [
        "Grew up in Crumlin, Dublin, and was a plumber's apprentice before pursuing MMA full-time",
        "Became the first fighter in UFC history to hold titles in two weight classes simultaneously",
        "Famous for his left-hand counter striking and pre-fight trash talk",
        "Irish fighter who headlined the biggest pay-per-view events in UFC history and fought Floyd Mayweather in boxing",
      ],
      answer: "Conor McGregor",
    },
    {
      clues: [
        "Grew up in the mountains of Dagestan, Russia, training with his father Abdulmanap from childhood",
        "Retired undefeated with a perfect 29-0 professional record",
        "Known for his suffocating grappling, relentless pressure, and dominant ground control",
        "Russian lightweight champion nicknamed 'The Eagle' who submitted Conor McGregor at UFC 229",
      ],
      answer: "Khabib Nurmagomedov",
    },
    {
      clues: [
        "Born in Curitiba, Brazil, and holds black belts in Brazilian Jiu-Jitsu, Judo, and Taekwondo",
        "Went on a 16-fight win streak in the UFC middleweight division, the longest in division history at the time",
        "Known as 'The Spider' for his elusive head movement and pinpoint counter-striking",
        "Brazilian legend who dominated the middleweight division for nearly seven years before his front-kick knockout of Vitor Belfort became iconic",
      ],
      answer: "Anderson Silva",
    },
    {
      clues: [
        "Grew up in Saint-Isidore, Quebec, Canada, and earned a black belt in Kyokushin Karate before transitioning to MMA",
        "Defended the UFC welterweight title nine consecutive times, the most in division history",
        "Known as 'GSP' and famous for his jab, takedown accuracy, and sportsmanlike conduct",
        "Canadian legend who won titles at both welterweight and middleweight and is considered the greatest welterweight ever",
      ],
      answer: "Georges St-Pierre",
    },
    {
      clues: [
        "Grew up in Pojuca, Bahia, Brazil, and trained in boxing and wrestling from a young age",
        "Became the first woman to hold UFC titles in two weight classes simultaneously (bantamweight and featherweight)",
        "Known as the 'Lioness' for her aggressive fighting style and knockout power",
        "Brazilian fighter widely regarded as the greatest female MMA fighter of all time, who retired in 2023",
      ],
      answer: "Amanda Nunes",
    },
    {
      clues: [
        "Born in Lagos, Nigeria, and moved to New Zealand at age 10, where he took up kickboxing",
        "Won the UFC middleweight title by knockout against Robert Whittaker in 2019",
        "Known as 'The Last Stylebender' for his anime-inspired nickname and flashy striking",
        "Nigerian-New Zealander known for his creative kickboxing techniques and showmanship in the octagon",
      ],
      answer: "Israel Adesanya",
    },
    {
      clues: [
        "Born in Auchi, Nigeria, and moved to the United States to pursue wrestling at college level",
        "Won 19 consecutive fights in the UFC, including a dominant welterweight title reign",
        "Known as the 'Nigerian Nightmare' for his relentless pace, wrestling dominance, and powerful striking",
        "Welterweight champion who defeated notable opponents like Colby Covington, Jorge Masvidal, and Gilbert Burns",
      ],
      answer: "Kamaru Usman",
    },
    {
      clues: [
        "Was an Olympic bronze medalist in judo at the 2008 Beijing Games before transitioning to MMA",
        "Won the UFC women's bantamweight title and defended it six times, finishing most opponents in the first round",
        "Known for her devastating armbar submissions and role in popularizing women's MMA",
        "American fighter nicknamed 'Rowdy' who became the first female UFC champion and crossed over into acting and WWE",
      ],
      answer: "Ronda Rousey",
    },
    {
      clues: [
        "Grew up in poverty in Guaruja, Brazil, and started training BJJ as a teenager at a local favela gym",
        "Won the UFC lightweight title by submitting Dustin Poirier at UFC 269",
        "Known as 'Do Bronx' and famous for his exceptional submission game with the most finishes in UFC history",
        "Brazilian lightweight champion who holds the record for most submission wins in UFC history",
      ],
      answer: "Charles Oliveira",
    },
    {
      clues: [
        "Was born in Cameroon and moved to France at age five, training in Muay Thai and Karate",
        "Became the UFC heavyweight champion in 2021 after a dramatic knockout of Stipe Miocic",
        "Known for his devastating power and fearsome knockout ability in both hands",
        "Cameroonian-French fighter nicknamed 'The Predator' who left the UFC to pursue boxing against Tyson Fury",
      ],
      answer: "Francis Ngannou",
    },
  ],

  baseball: [
    {
      clues: [
        "Grew up in Oshu, Iwate Prefecture, Japan, and idolized Yu Darvish as a young pitcher",
        "Became the first player to be named an All-Star as both a pitcher and hitter in the same season",
        "Won back-to-back AL MVP awards and signed the largest contract in sports history with the Dodgers",
        "Japanese two-way phenom who pitches and hits at an elite level, often compared to Babe Ruth",
      ],
      answer: "Shohei Ohtani",
    },
    {
      clues: [
        "Grew up in Baltimore and was sent to a reform school at age seven, where a Xaverian Brother taught him baseball",
        "Hit 714 career home runs, a record that stood for 39 years",
        "Was also an elite left-handed pitcher who held the World Series consecutive scoreless innings record for decades",
        "Legendary Yankees slugger nicknamed 'The Sultan of Swat' who transformed baseball in the 1920s",
      ],
      answer: "Babe Ruth",
    },
    {
      clues: [
        "Was drafted 25th overall in 2009 out of Millville High School in New Jersey",
        "Won three AL MVP awards and was once considered the best all-around player in baseball",
        "Known for his smooth swing, elite defense in center field, and injury-plagued later career",
        "Los Angeles Angels outfielder nicknamed 'The Millville Meteor' who played his entire career with the Angels",
      ],
      answer: "Mike Trout",
    },
    {
      clues: [
        "Was drafted sixth overall in 1992 out of Kalamazoo Central High School in Michigan",
        "Earned 14 All-Star selections and finished his career with a .310 batting average and 3,465 hits",
        "Known for his signature jump throw from the shortstop hole and clutch performances in October",
        "Yankees captain nicknamed 'The Captain' who led New York to five World Series titles",
      ],
      answer: "Derek Jeter",
    },
    {
      clues: [
        "Made his major league debut at age 20 for the New York Giants in 1951 after starring in the Negro Leagues",
        "Made one of baseball's most famous catches -- an over-the-shoulder grab in the 1954 World Series known as 'The Catch'",
        "Hit 660 career home runs and won two MVP awards and 12 Gold Gloves",
        "Giants legend known as the 'Say Hey Kid' who is often ranked as the greatest all-around player in baseball history",
      ],
      answer: "Willie Mays",
    },
    {
      clues: [
        "Grew up in Mobile, Alabama, in the segregated South and started in the Negro Leagues before breaking through",
        "Broke Babe Ruth's career home run record in 1974, hitting his 715th homer off Al Downing",
        "Finished his career with 755 home runs and 2,297 RBIs, both records at the time",
        "Braves legend nicknamed 'Hammerin' Hank' who endured racial threats while chasing Ruth's record",
      ],
      answer: "Hank Aaron",
    },
    {
      clues: [
        "Was a four-sport athlete at UCLA before signing with the Montreal Royals, a minor league affiliate",
        "Stole home 19 times in his career and won the inaugural Rookie of the Year Award in 1947",
        "Wore the number 42, which was retired across all of Major League Baseball in his honor",
        "Brooklyn Dodgers legend who broke baseball's color barrier in 1947 as the first African American player in the modern major leagues",
      ],
      answer: "Jackie Robinson",
    },
    {
      clues: [
        "Was drafted seventh overall in 2006 out of Texas A&M University by the Dodgers",
        "Won three Cy Young Awards and threw a no-hitter against the Colorado Rockies in 2014",
        "Known for his devastating curveball, one of the most unhittable pitches in baseball history",
        "Los Angeles Dodgers left-handed pitcher who spent his entire career with the team and was the ace of multiple World Series runs",
      ],
      answer: "Clayton Kershaw",
    },
    {
      clues: [
        "Was drafted 32nd overall in 2013 out of Fresno State, not considered a top-tier prospect initially",
        "Hit 62 home runs in 2022, breaking Roger Maris's American League single-season record",
        "Known for his towering 6'7\" frame and prodigious power to all fields",
        "New York Yankees outfielder who became the AL home run king and a perennial MVP candidate",
      ],
      answer: "Aaron Judge",
    },
    {
      clues: [
        "Was born in Santo Domingo, Dominican Republic, and signed with the Oakland A's at age 16",
        "Hit over 700 career home runs and won three MVP awards across two leagues",
        "Known for his disciplined approach, opposite-field power, and remarkable consistency over 22 seasons",
        "Slugger nicknamed 'The Machine' who starred for the Cardinals and Angels and is one of the greatest right-handed hitters ever",
      ],
      answer: "Albert Pujols",
    },
    {
      clues: [
        "Born in Okinawa, Japan, and played nine seasons in Nippon Professional Baseball before coming to MLB at age 27",
        "Collected 3,089 career MLB hits and 4,367 combined professional hits across Japan and the U.S.",
        "Known for his slap-hitting style, extraordinary contact ability, and blazing speed from the left side",
        "Japanese outfielder who won 10 consecutive Gold Gloves with the Seattle Mariners and set the single-season hits record with 262 in 2004",
      ],
      answer: "Ichiro Suzuki",
    },
  ],

  golf: [
    {
      clues: [
        "Appeared on The Mike Douglas Show at age two, putting against Bob Hope",
        "Holds the record for the most consecutive cuts made on the PGA Tour at 142",
        "Won 15 major championships and completed the 'Tiger Slam' by holding all four major trophies at once",
        "American golfer who dominated the sport in the 2000s and won the 2019 Masters in a legendary comeback",
      ],
      answer: "Tiger Woods",
    },
    {
      clues: [
        "Grew up in Holywood, Northern Ireland, and won the Junior Ryder Cup at age 15",
        "Won four major championships before turning 30, including back-to-back in 2014",
        "Known for his aggressive driving, powerful swing, and fiery competitiveness on the course",
        "Northern Irish golfer who has been one of the PGA Tour's most consistent performers and a fan favorite for over a decade",
      ],
      answer: "Rory McIlroy",
    },
    {
      clues: [
        "Grew up in Columbus, Ohio, and was a standout in multiple sports including basketball and football before focusing on golf",
        "Won 18 major championships, the most in golf history, including six Masters titles",
        "Known as 'The Golden Bear' for his power, course management, and longevity at the highest level",
        "American legend who designed over 400 golf courses worldwide and is widely considered the greatest golfer ever",
      ],
      answer: "Jack Nicklaus",
    },
    {
      clues: [
        "Grew up in Latrobe, Pennsylvania, and learned golf from his father, who was a greenkeeper and club pro",
        "Won seven major championships and was instrumental in popularizing golf on television in the 1960s",
        "Known for his go-for-broke playing style, signature follow-through, and 'Arnie's Army' fanbase",
        "American legend nicknamed 'The King' who helped transform golf into a mainstream spectator sport",
      ],
      answer: "Arnold Palmer",
    },
    {
      clues: [
        "Was a standout player at Arizona State University before turning professional in 1992",
        "Won six major championships, including three Masters titles, and is famous for his left-handed play despite being right-handed naturally",
        "Known for his aggressive approach, spectacular flop shots, and risk-taking course management",
        "American golfer nicknamed 'Lefty' who was one of Tiger Woods's greatest rivals for two decades",
      ],
      answer: "Phil Mickelson",
    },
    {
      clues: [
        "Grew up in Ridgewood, New Jersey, and played college golf at the University of Texas",
        "Won the Masters in both 2022 and 2024 and held the world number one ranking for an extended period",
        "Known for his methodical approach, consistent ball-striking, and calm demeanor under pressure",
        "American golfer who became the dominant force on the PGA Tour in the mid-2020s",
      ],
      answer: "Scottie Scheffler",
    },
    {
      clues: [
        "Played college golf at Florida State University and initially struggled on the PGA Tour before breaking through",
        "Won five major championships, including the PGA Championship four times",
        "Known for his powerful build, intense focus, and ability to peak at major championships",
        "American golfer who was a central figure in the LIV Golf controversy after joining the breakaway league",
      ],
      answer: "Brooks Koepka",
    },
    {
      clues: [
        "Born in Johannesburg, South Africa, and overcame poverty to become a world-class golfer",
        "Won nine major championships across the regular and senior tours, completing the career Grand Slam",
        "Known as 'The Black Knight' and for his global ambassadorship of golf, traveling millions of miles",
        "South African legend who, along with Jack Nicklaus and Arnold Palmer, formed golf's 'Big Three' in the 1960s",
      ],
      answer: "Gary Player",
    },
    {
      clues: [
        "Won the U.S. Junior Amateur twice and attended the University of Texas on a golf scholarship",
        "Won all four major championships by age 23, becoming the youngest player to complete the career Grand Slam at the time",
        "Known for his brilliant short game and clutch putting under pressure",
        "Texan golfer who won the 2015 Masters at age 21 and has been a Ryder Cup stalwart for the United States",
      ],
      answer: "Jordan Spieth",
    },
    {
      clues: [
        "Grew up in Pedrena, Cantabria, Spain, and learned to play golf on the beach with a makeshift club",
        "Won five major championships and was the first European to win the Masters in 1980",
        "Known for his extraordinary short game, creative shot-making, and flair for the dramatic",
        "Spanish legend who helped establish European golf on the world stage and co-created the modern Ryder Cup rivalry",
      ],
      answer: "Seve Ballesteros",
    },
    {
      clues: [
        "Grew up in Johannesburg, South Africa, and showed exceptional talent from a young age, turning professional at 19",
        "Won four major championships: the U.S. Open twice and The Open Championship twice",
        "Known for his controlled fade, mental toughness in major championships, and calm demeanor under pressure",
        "South African golfer nicknamed 'The Big Easy' for his smooth, effortless-looking swing",
      ],
      answer: "Ernie Els",
    },
  ],

  hockey: [
    {
      clues: [
        "Started skating at age two on a backyard rink his father Walter built in Brantford, Ontario",
        "Holds over 60 NHL records, including most career goals (894) and assists (1,963)",
        "Scored 50 goals in just 39 games during the 1981-82 season, an unmatched feat",
        "Edmonton Oilers and Los Angeles Kings legend known as 'The Great One,' universally considered the greatest hockey player ever",
      ],
      answer: "Wayne Gretzky",
    },
    {
      clues: [
        "Was granted exceptional player status to be drafted first overall by the OHL at age 15",
        "Won the Art Ross Trophy as the NHL's leading scorer multiple times before turning 28",
        "Known for his blazing speed and ability to make highlight-reel plays at full stride",
        "Edmonton Oilers captain and Canadian superstar who has been called the best player in the world since entering the league in 2015",
      ],
      answer: "Connor McDavid",
    },
    {
      clues: [
        "Grew up in Cole Harbour, Nova Scotia, the same hometown as Nathan MacKinnon",
        "Was drafted first overall in 2005 and won the Conn Smythe Trophy three times",
        "Known for his exceptional vision, two-way play, and leadership",
        "Pittsburgh Penguins captain nicknamed 'Sid the Kid' who won three Stanley Cups",
      ],
      answer: "Sidney Crosby",
    },
    {
      clues: [
        "Was born in Montreal and attended a private school in Quebec before being drafted first overall in 1984",
        "Scored 199 points in the 1988-89 season, the second-highest single-season total in NHL history",
        "Known for his incredible size (6'4\"), skill combination, and ability to dominate when healthy",
        "Pittsburgh Penguins legend nicknamed 'Super Mario' who overcame Hodgkin's lymphoma during his career",
      ],
      answer: "Mario Lemieux",
    },
    {
      clues: [
        "Was drafted first overall in 2004 by the Washington Capitals from Dynamo Moscow",
        "Scored his 800th career goal and is chasing Wayne Gretzky's all-time goals record",
        "Known as 'The Great Eight' for his explosive one-timer from the left circle on the power play",
        "Russian-born Capitals captain who led Washington to their first Stanley Cup in 2018",
      ],
      answer: "Alex Ovechkin",
    },
    {
      clues: [
        "Grew up in Parry Sound, Ontario, and was so talented that he was playing against adults by age 14",
        "Won eight consecutive Norris Trophies as the NHL's best defenseman from 1968 to 1975",
        "Revolutionized the defenseman position by playing an offensive, rushing style",
        "Boston Bruins legend who scored the famous 'flying goal' to win the 1970 Stanley Cup, widely considered the greatest defenseman ever",
      ],
      answer: "Bobby Orr",
    },
    {
      clues: [
        "Was born in Floral, Saskatchewan, and played minor hockey in Saskatoon before going professional",
        "Played 26 NHL seasons and held the record for most games played (1,767) at the time of his retirement",
        "Known as 'Mr. Hockey' for his toughness, skill, and incredible longevity in the sport",
        "Detroit Red Wings legend who played into his 50s and is one of the all-time greatest forwards",
      ],
      answer: "Gordie Howe",
    },
    {
      clues: [
        "Was drafted in the third round (51st overall) by the Montreal Canadiens in 1984, considered a steal",
        "Won the Conn Smythe Trophy three times and the Vezina Trophy three times",
        "Revolutionized goaltending with the 'butterfly' style that became the standard for modern goalies",
        "Montreal Canadiens and Colorado Avalanche goaltender nicknamed 'Saint Patrick' who won four Stanley Cups",
      ],
      answer: "Patrick Roy",
    },
    {
      clues: [
        "Was born in Kladno, Czechoslovakia, and defected to play in North America during the Cold War era",
        "Played in the NHL until age 45 and scored 766 career goals, third all-time at retirement",
        "Known for his flowing mullet hairstyle and powerful wrist shot from the right wing",
        "Czech legend who won two Stanley Cups with the Pittsburgh Penguins alongside Mario Lemieux",
      ],
      answer: "Jaromir Jagr",
    },
    {
      clues: [
        "Was drafted first overall by the Toronto Maple Leafs in 2016 from the USNTDP program",
        "Scored 60 goals in the 2021-22 season, becoming the first Maple Leaf to reach that mark",
        "Known for his lethal wrist shot, quick release, and goal-scoring ability from anywhere in the offensive zone",
        "American-born Maple Leafs center from Scottsdale, Arizona, who became the face of the franchise",
      ],
      answer: "Auston Matthews",
    },
    {
      clues: [
        "Was born in Montreal, Quebec, and grew up idolizing the Canadiens, playing minor hockey in the QMJHL",
        "Holds the NHL record for most career wins by a goaltender with 691",
        "Known for his puck-handling ability and his signature 'trap' defensive system with the Devils",
        "New Jersey Devils goaltending legend who won three Stanley Cups and four Vezina Trophies over a 22-year career",
      ],
      answer: "Martin Brodeur",
    },
  ],
};
