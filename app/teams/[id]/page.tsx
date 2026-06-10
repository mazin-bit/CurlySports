"use client";

import AppShell from "@/components/AppShell";
import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./team-detail.module.css";
import { Trophy, Users, Star, Shield, ChevronLeft, Info, Building2, MapPin, Calendar, Award } from "lucide-react";

const ESPN = "https://site.api.espn.com/apis/site/v2/sports";

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamCoach { name: string; experience: number | null; }

interface TeamDetail {
  id: string; name: string; shortName: string; abbr: string;
  logo: string | null; color: string | null; altColor: string | null;
  record: string | null; wins: number; draws: number; losses: number;
  venue: string | null; capacity: number | null;
  leagueName: string; leagueId: string; coach: TeamCoach | null;
}

interface Athlete {
  id: string; name: string; jersey: string; position: string; positionAbbr: string;
  headshot: string | null; age: number | null; nationality: string | null; flagUrl: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEAGUE_PATHS: Record<string, string> = {
  "eng.1":"soccer/eng.1","esp.1":"soccer/esp.1","ger.1":"soccer/ger.1",
  "ita.1":"soccer/ita.1","fra.1":"soccer/fra.1","por.1":"soccer/por.1",
  "ned.1":"soccer/ned.1","tur.1":"soccer/tur.1","sco.1":"soccer/sco.1",
  "bel.1":"soccer/bel.1","rus.1":"soccer/rus.1","gre.1":"soccer/gre.1",
  "eng.2":"soccer/eng.2","usa.1":"soccer/usa.1","mex.1":"soccer/mex.1",
  "bra.1":"soccer/bra.1","arg.1":"soccer/arg.1","col.1":"soccer/col.1",
  "chi.1":"soccer/chi.1","ecu.1":"soccer/ecu.1","jpn.1":"soccer/jpn.1",
  "ksa.1":"soccer/ksa.1","aus.1":"soccer/aus.1","chn.1":"soccer/chn.1",
  "idn.1":"soccer/idn.1","uefa.champions":"soccer/uefa.champions",
  "uefa.europa":"soccer/uefa.europa","conmebol.libertadores":"soccer/conmebol.libertadores",
  "nba":"basketball/nba","nfl":"football/nfl","nhl":"hockey/nhl","mlb":"baseball/mlb",
};

const POSITIONS_ORDER = [
  "GK","G","CB","LB","RB","LWB","RWB","D",
  "CDM","CM","CAM","LM","RM","M","LW","RW","CF","ST","SS","F",
];

const POS_GK  = new Set(["GK","G"]);
const POS_DEF = new Set(["CB","LCB","RCB","LB","RB","LWB","RWB","D","SW","FB","WB"]);
const POS_MID = new Set(["CDM","CM","CAM","LM","RM","M","DM","AM","WM","DMF","CMF","AMF"]);
const POS_FWD = new Set(["LW","RW","CF","ST","SS","F","FW","ATT","LWF","RWF","W","S"]);

// ─── Hardcoded Data ───────────────────────────────────────────────────────────

const CLUB_LEGENDS: Record<string, {name:string; role:string; period:string; nationality:string}[]> = {
  "Arsenal": [
    {name:"Thierry Henry", role:"Forward", period:"1999–2007, 2012", nationality:"France"},
    {name:"Dennis Bergkamp", role:"Forward", period:"1995–2006", nationality:"Netherlands"},
    {name:"Patrick Vieira", role:"Midfielder", period:"1996–2005", nationality:"France"},
    {name:"Tony Adams", role:"Defender", period:"1983–2002", nationality:"England"},
    {name:"Robert Pires", role:"Winger", period:"2000–2006", nationality:"France"},
    {name:"Ian Wright", role:"Forward", period:"1991–1998", nationality:"England"},
  ],
  "Manchester City": [
    {name:"Sergio Agüero", role:"Forward", period:"2011–2021", nationality:"Argentina"},
    {name:"Vincent Kompany", role:"Defender", period:"2008–2019", nationality:"Belgium"},
    {name:"David Silva", role:"Midfielder", period:"2010–2020", nationality:"Spain"},
    {name:"Kevin De Bruyne", role:"Midfielder", period:"2015–present", nationality:"Belgium"},
    {name:"Yaya Touré", role:"Midfielder", period:"2010–2018", nationality:"Côte d'Ivoire"},
    {name:"Joe Hart", role:"Goalkeeper", period:"2006–2016", nationality:"England"},
  ],
  "Liverpool": [
    {name:"Steven Gerrard", role:"Midfielder", period:"1998–2015", nationality:"England"},
    {name:"Kenny Dalglish", role:"Forward", period:"1977–1990", nationality:"Scotland"},
    {name:"Ian Rush", role:"Forward", period:"1980–1996", nationality:"Wales"},
    {name:"Robbie Fowler", role:"Forward", period:"1993–2001", nationality:"England"},
    {name:"Jamie Carragher", role:"Defender", period:"1996–2013", nationality:"England"},
    {name:"Sami Hyypiä", role:"Defender", period:"1999–2009", nationality:"Finland"},
  ],
  "Chelsea": [
    {name:"Frank Lampard", role:"Midfielder", period:"2001–2014", nationality:"England"},
    {name:"John Terry", role:"Defender", period:"1998–2017", nationality:"England"},
    {name:"Didier Drogba", role:"Forward", period:"2004–2012, 2014–2015", nationality:"Côte d'Ivoire"},
    {name:"Petr Čech", role:"Goalkeeper", period:"2004–2015", nationality:"Czech Republic"},
    {name:"Gianfranco Zola", role:"Forward", period:"1996–2003", nationality:"Italy"},
    {name:"Dennis Wise", role:"Midfielder", period:"1990–2001", nationality:"England"},
  ],
  "Manchester United": [
    {name:"Bobby Charlton", role:"Midfielder", period:"1956–1973", nationality:"England"},
    {name:"George Best", role:"Forward", period:"1963–1974", nationality:"N. Ireland"},
    {name:"Eric Cantona", role:"Forward", period:"1992–1997", nationality:"France"},
    {name:"Ryan Giggs", role:"Winger", period:"1990–2014", nationality:"Wales"},
    {name:"Roy Keane", role:"Midfielder", period:"1993–2005", nationality:"Ireland"},
    {name:"Peter Schmeichel", role:"Goalkeeper", period:"1991–1999", nationality:"Denmark"},
  ],
  "Tottenham Hotspur": [
    {name:"Jimmy Greaves", role:"Forward", period:"1961–1970", nationality:"England"},
    {name:"Glenn Hoddle", role:"Midfielder", period:"1975–1987", nationality:"England"},
    {name:"Gareth Bale", role:"Winger", period:"2007–2013, 2020–2021", nationality:"Wales"},
    {name:"Ledley King", role:"Defender", period:"1998–2012", nationality:"England"},
    {name:"Pat Jennings", role:"Goalkeeper", period:"1964–1977", nationality:"N. Ireland"},
    {name:"Teddy Sheringham", role:"Forward", period:"1992–1997, 2001–2003", nationality:"England"},
  ],
  "Aston Villa": [
    {name:"Paul McGrath", role:"Defender", period:"1989–1996", nationality:"Ireland"},
    {name:"Gareth Barry", role:"Midfielder", period:"1997–2009", nationality:"England"},
    {name:"Dwight Yorke", role:"Forward", period:"1989–1998", nationality:"Trinidad & Tobago"},
    {name:"Peter Withe", role:"Forward", period:"1980–1985", nationality:"England"},
    {name:"Ron Saunders", role:"Manager", period:"1974–1982", nationality:"England"},
  ],
  "Newcastle United": [
    {name:"Alan Shearer", role:"Forward", period:"1996–2006", nationality:"England"},
    {name:"Peter Beardsley", role:"Midfielder", period:"1983–1987, 1993–1997", nationality:"England"},
    {name:"Kevin Keegan", role:"Forward", period:"1982–1984", nationality:"England"},
    {name:"Malcolm Macdonald", role:"Forward", period:"1971–1976", nationality:"England"},
    {name:"Shay Given", role:"Goalkeeper", period:"1997–2009", nationality:"Ireland"},
  ],
  "Real Madrid": [
    {name:"Cristiano Ronaldo", role:"Forward", period:"2009–2018", nationality:"Portugal"},
    {name:"Raúl González", role:"Forward", period:"1994–2010", nationality:"Spain"},
    {name:"Iker Casillas", role:"Goalkeeper", period:"1999–2015", nationality:"Spain"},
    {name:"Alfredo Di Stéfano", role:"Forward", period:"1953–1964", nationality:"Argentina"},
    {name:"Sergio Ramos", role:"Defender", period:"2005–2021", nationality:"Spain"},
    {name:"Zinedine Zidane", role:"Midfielder", period:"2001–2006", nationality:"France"},
  ],
  "Barcelona": [
    {name:"Lionel Messi", role:"Forward", period:"2004–2021", nationality:"Argentina"},
    {name:"Johan Cruyff", role:"Forward", period:"1973–1978", nationality:"Netherlands"},
    {name:"Xavi Hernández", role:"Midfielder", period:"1998–2015", nationality:"Spain"},
    {name:"Andrés Iniesta", role:"Midfielder", period:"2002–2018", nationality:"Spain"},
    {name:"Ronaldinho", role:"Forward", period:"2003–2008", nationality:"Brazil"},
    {name:"Carles Puyol", role:"Defender", period:"1999–2014", nationality:"Spain"},
  ],
  "Atletico Madrid": [
    {name:"Fernando Torres", role:"Forward", period:"2001–2007, 2015–2018", nationality:"Spain"},
    {name:"Diego Forlán", role:"Forward", period:"2004–2011", nationality:"Uruguay"},
    {name:"Antoine Griezmann", role:"Forward", period:"2014–2019, 2021–2024", nationality:"France"},
    {name:"Sergio Kun Agüero", role:"Forward", period:"2006–2011", nationality:"Argentina"},
    {name:"Diego Godín", role:"Defender", period:"2010–2019", nationality:"Uruguay"},
    {name:"Jan Oblak", role:"Goalkeeper", period:"2014–present", nationality:"Slovenia"},
  ],
  "Bayern Munich": [
    {name:"Franz Beckenbauer", role:"Defender", period:"1964–1977", nationality:"Germany"},
    {name:"Gerd Müller", role:"Forward", period:"1964–1979", nationality:"Germany"},
    {name:"Oliver Kahn", role:"Goalkeeper", period:"1994–2008", nationality:"Germany"},
    {name:"Franck Ribéry", role:"Winger", period:"2007–2019", nationality:"France"},
    {name:"Thomas Müller", role:"Forward", period:"2008–present", nationality:"Germany"},
    {name:"Robert Lewandowski", role:"Forward", period:"2014–2022", nationality:"Poland"},
  ],
  "Borussia Dortmund": [
    {name:"Marco Reus", role:"Midfielder", period:"2012–2024", nationality:"Germany"},
    {name:"Robert Lewandowski", role:"Forward", period:"2010–2014", nationality:"Poland"},
    {name:"Matthias Sammer", role:"Midfielder", period:"1992–1998", nationality:"Germany"},
    {name:"Lars Ricken", role:"Midfielder", period:"1993–2006", nationality:"Germany"},
    {name:"Dortmund Legend", role:"Forward", period:"1980s", nationality:"Germany"},
  ],
  "Juventus": [
    {name:"Alessandro Del Piero", role:"Forward", period:"1993–2012", nationality:"Italy"},
    {name:"Zinedine Zidane", role:"Midfielder", period:"1996–2001", nationality:"France"},
    {name:"Pavel Nedvěd", role:"Midfielder", period:"2001–2009", nationality:"Czech Republic"},
    {name:"Michel Platini", role:"Midfielder", period:"1982–1987", nationality:"France"},
    {name:"Gianluigi Buffon", role:"Goalkeeper", period:"2001–2018, 2019–2021", nationality:"Italy"},
    {name:"Roberto Baggio", role:"Forward", period:"1990–1995", nationality:"Italy"},
  ],
  "Inter Milan": [
    {name:"Javier Zanetti", role:"Defender", period:"1995–2014", nationality:"Argentina"},
    {name:"Ronaldo Nazário", role:"Forward", period:"1997–2002", nationality:"Brazil"},
    {name:"Sandro Mazzola", role:"Forward", period:"1960–1977", nationality:"Italy"},
    {name:"Esteban Cambiasso", role:"Midfielder", period:"2004–2014", nationality:"Argentina"},
    {name:"Dejan Stanković", role:"Midfielder", period:"2004–2013", nationality:"Serbia"},
    {name:"Giuseppe Meazza", role:"Forward", period:"1927–1940", nationality:"Italy"},
  ],
  "AC Milan": [
    {name:"Paolo Maldini", role:"Defender", period:"1985–2009", nationality:"Italy"},
    {name:"Franco Baresi", role:"Defender", period:"1977–1997", nationality:"Italy"},
    {name:"Andriy Shevchenko", role:"Forward", period:"1999–2006, 2008–2012", nationality:"Ukraine"},
    {name:"Kaká", role:"Midfielder", period:"2003–2009, 2013–2014", nationality:"Brazil"},
    {name:"George Weah", role:"Forward", period:"1995–2000", nationality:"Liberia"},
    {name:"Filippo Inzaghi", role:"Forward", period:"2001–2012", nationality:"Italy"},
  ],
  "Paris Saint-Germain": [
    {name:"Zlatan Ibrahimović", role:"Forward", period:"2012–2016", nationality:"Sweden"},
    {name:"Neymar Jr.", role:"Forward", period:"2017–2023", nationality:"Brazil"},
    {name:"Marco Verratti", role:"Midfielder", period:"2012–2023", nationality:"Italy"},
    {name:"Pauleta", role:"Forward", period:"2003–2008", nationality:"Portugal"},
    {name:"Ronaldinho", role:"Forward", period:"2001–2003", nationality:"Brazil"},
    {name:"Safet Sušić", role:"Midfielder", period:"1982–1991", nationality:"Yugoslavia"},
  ],
  "Napoli": [
    {name:"Diego Maradona", role:"Forward", period:"1984–1991", nationality:"Argentina"},
    {name:"Ciro Ferrara", role:"Defender", period:"1986–2000", nationality:"Italy"},
    {name:"Dino Zoff", role:"Goalkeeper", period:"1967–1972", nationality:"Italy"},
    {name:"Ezequiel Lavezzi", role:"Forward", period:"2007–2012", nationality:"Argentina"},
    {name:"Lorenzo Insigne", role:"Forward", period:"2012–2022", nationality:"Italy"},
  ],
};

const CLUB_INFO_EXTRA: Record<string, {founded:number; owner?:string; nickname?:string}> = {
  "Arsenal": { founded: 1886, owner: "Stan Kroenke (KSE)", nickname: "The Gunners" },
  "Manchester City": { founded: 1880, owner: "Sheikh Mansour / City Football Group", nickname: "The Citizens" },
  "Liverpool": { founded: 1892, owner: "Fenway Sports Group", nickname: "The Reds" },
  "Chelsea": { founded: 1905, owner: "Todd Boehly / Clearlake Capital", nickname: "The Blues" },
  "Manchester United": { founded: 1878, owner: "INEOS / Sir Jim Ratcliffe", nickname: "The Red Devils" },
  "Tottenham Hotspur": { founded: 1882, owner: "ENIC Group / Joe Lewis", nickname: "Spurs" },
  "Aston Villa": { founded: 1874, owner: "Nassef Sawiris & Wes Edens", nickname: "The Villans" },
  "Newcastle United": { founded: 1892, owner: "PIF (Saudi Arabia)", nickname: "The Magpies" },
  "West Ham United": { founded: 1895, owner: "David Sullivan & Daniel Kretinsky", nickname: "The Hammers" },
  "Everton": { founded: 1878, owner: "The Friedkin Group", nickname: "The Toffees" },
  "Brighton": { founded: 1901, owner: "Tony Bloom", nickname: "The Seagulls" },
  "AFC Bournemouth": { founded: 1899, owner: "Bill Foley / Aser Group", nickname: "The Cherries" },
  "Nottingham Forest": { founded: 1865, owner: "Evangelos Marinakis", nickname: "The Tricky Trees" },
  "Fulham": { founded: 1879, owner: "Shahid Khan", nickname: "The Cottagers" },
  "Brentford": { founded: 1889, owner: "Matthew Benham", nickname: "The Bees" },
  "Real Madrid": { founded: 1902, owner: "Member-owned (socios)", nickname: "Los Blancos" },
  "Barcelona": { founded: 1899, owner: "Member-owned (socios)", nickname: "Blaugrana / Barça" },
  "Atletico Madrid": { founded: 1903, owner: "Idan Ofer & Miguel Ángel Gil", nickname: "Los Colchoneros" },
  "Sevilla": { founded: 1890, owner: "Sevilla FC (socios)", nickname: "Los Nervionenses" },
  "Real Betis": { founded: 1907, owner: "Various shareholders", nickname: "Los Béticos / Verdiblancos" },
  "Bayern Munich": { founded: 1900, owner: "Member-owned (50+1)", nickname: "Die Roten" },
  "Borussia Dortmund": { founded: 1909, owner: "Public company (BVB 09 e.V.)", nickname: "Die Schwarz-Gelben" },
  "Bayer Leverkusen": { founded: 1904, owner: "Bayer AG (50+1 rule)", nickname: "Die Werkself" },
  "RB Leipzig": { founded: 2009, owner: "Red Bull GmbH", nickname: "Die Roten Bullen" },
  "Juventus": { founded: 1897, owner: "Exor / Elkann family", nickname: "La Vecchia Signora" },
  "Inter Milan": { founded: 1908, owner: "Oaktree Capital Management", nickname: "Nerazzurri" },
  "AC Milan": { founded: 1899, owner: "RedBird Capital Partners", nickname: "Rossoneri" },
  "Napoli": { founded: 1926, owner: "Aurelio De Laurentiis (FilmAuro)", nickname: "Gli Azzurri" },
  "Roma": { founded: 1927, owner: "Dan & Ryan Friedkin", nickname: "I Giallorossi" },
  "Paris Saint-Germain": { founded: 1970, owner: "QSI (Qatar Sports Investments)", nickname: "Les Parisiens" },
  "Monaco": { founded: 1924, owner: "Dmitri Rybolovlev (AS Monaco SAM)", nickname: "Les Rouges et Blancs" },
  "Ajax": { founded: 1900, owner: "Public company (AFC Ajax NV)", nickname: "De Godenzonen" },
  "PSV Eindhoven": { founded: 1913, owner: "Philips / Foundation", nickname: "Boeren" },
  "Porto": { founded: 1893, owner: "Futebol Clube do Porto", nickname: "Os Dragões" },
  "Benfica": { founded: 1904, owner: "Sport Lisboa e Benfica", nickname: "As Águias" },
  "Sporting CP": { founded: 1906, owner: "Sporting CP (socios)", nickname: "Os Leões" },
  "Celtic": { founded: 1888, owner: "Celtic PLC / supporters", nickname: "The Bhoys / The Hoops" },
  "Rangers": { founded: 1872, owner: "Various shareholders", nickname: "The Gers / Ibrox" },
  "Galatasaray": { founded: 1905, owner: "Galatasaray A.Ş. (public)", nickname: "Cim Bom / The Lions" },
  "Fenerbahçe": { founded: 1907, owner: "Fenerbahçe S.K.", nickname: "The Yellow Canaries" },
  "River Plate": { founded: 1901, owner: "Club Atlético River Plate", nickname: "El Millonario" },
  "Boca Juniors": { founded: 1905, owner: "Club Atlético Boca Juniors", nickname: "Los Xeneizes" },
  "Flamengo": { founded: 1895, owner: "Clube de Regatas do Flamengo", nickname: "Rubro-Negro" },
};

const TEAM_ACHIEVEMENTS: Record<string, {title:string;category:string}[]> = {
  "Arsenal": [
    {title:"13× Premier League",category:"League"},{title:"14× FA Cup",category:"Cup"},
    {title:"2× League Cup",category:"Cup"},{title:"1× Cup Winners' Cup",category:"European"},
  ],
  "Manchester City": [
    {title:"10× Premier League",category:"League"},{title:"7× League Cup",category:"Cup"},
    {title:"7× FA Cup",category:"Cup"},{title:"1× Champions League",category:"European"},
    {title:"1× Club World Cup",category:"World"},
  ],
  "Liverpool": [
    {title:"19× League Title",category:"League"},{title:"9× League Cup",category:"Cup"},
    {title:"8× FA Cup",category:"Cup"},{title:"6× Champions League",category:"European"},
    {title:"4× UEFA Super Cup",category:"European"},
  ],
  "Chelsea": [
    {title:"6× Premier League",category:"League"},{title:"8× FA Cup",category:"Cup"},
    {title:"5× League Cup",category:"Cup"},{title:"2× Champions League",category:"European"},
    {title:"2× Europa League",category:"European"},
  ],
  "Manchester United": [
    {title:"20× Premier League",category:"League"},{title:"12× FA Cup",category:"Cup"},
    {title:"6× League Cup",category:"Cup"},{title:"3× Champions League",category:"European"},
    {title:"1× Cup Winners' Cup",category:"European"},
  ],
  "Tottenham Hotspur": [
    {title:"2× First Division",category:"League"},{title:"8× FA Cup",category:"Cup"},
    {title:"4× League Cup",category:"Cup"},{title:"1× UEFA Cup",category:"European"},
  ],
  "Aston Villa": [
    {title:"7× First Division",category:"League"},{title:"7× FA Cup",category:"Cup"},
    {title:"5× League Cup",category:"Cup"},{title:"1× European Cup",category:"European"},
  ],
  "Newcastle United": [
    {title:"4× First Division",category:"League"},{title:"6× FA Cup",category:"Cup"},
    {title:"1× Fairs Cup",category:"European"},
  ],
  "Real Madrid": [
    {title:"36× La Liga",category:"League"},{title:"20× Copa del Rey",category:"Cup"},
    {title:"14× Champions League",category:"European"},{title:"8× Club World Cup",category:"World"},
    {title:"6× UEFA Super Cup",category:"European"},
  ],
  "Barcelona": [
    {title:"27× La Liga",category:"League"},{title:"31× Copa del Rey",category:"Cup"},
    {title:"5× Champions League",category:"European"},{title:"5× Club World Cup",category:"World"},
  ],
  "Atletico Madrid": [
    {title:"11× La Liga",category:"League"},{title:"10× Copa del Rey",category:"Cup"},
    {title:"3× Europa League",category:"European"},{title:"2× Cup Winners' Cup",category:"European"},
  ],
  "Bayern Munich": [
    {title:"33× Bundesliga",category:"League"},{title:"20× DFB-Pokal",category:"Cup"},
    {title:"6× Champions League",category:"European"},{title:"2× Club World Cup",category:"World"},
  ],
  "Borussia Dortmund": [
    {title:"8× Bundesliga",category:"League"},{title:"4× DFB-Pokal",category:"Cup"},
    {title:"1× Champions League",category:"European"},{title:"1× Cup Winners' Cup",category:"European"},
  ],
  "Juventus": [
    {title:"36× Serie A",category:"League"},{title:"14× Coppa Italia",category:"Cup"},
    {title:"2× Champions League",category:"European"},{title:"3× UEFA Cup",category:"European"},
  ],
  "Inter Milan": [
    {title:"20× Serie A",category:"League"},{title:"8× Coppa Italia",category:"Cup"},
    {title:"3× Champions League",category:"European"},{title:"3× UEFA Cup",category:"European"},
  ],
  "AC Milan": [
    {title:"19× Serie A",category:"League"},{title:"5× Coppa Italia",category:"Cup"},
    {title:"7× Champions League",category:"European"},{title:"3× UEFA Super Cup",category:"European"},
  ],
  "Paris Saint-Germain": [
    {title:"12× Ligue 1",category:"League"},{title:"15× Coupe de France",category:"Cup"},
    {title:"1× Cup Winners' Cup",category:"European"},
  ],
  "Napoli": [
    {title:"3× Serie A",category:"League"},{title:"6× Coppa Italia",category:"Cup"},
    {title:"1× UEFA Cup",category:"European"},
  ],
};

// ─── Data Fetchers ────────────────────────────────────────────────────────────

async function fetchTeamDetail(leaguePath:string, teamId:string, leagueId:string): Promise<TeamDetail|null> {
  try {
    const res = await fetch(`${ESPN}/${leaguePath}/teams/${teamId}`);
    if (!res.ok) return null;
    const data = await res.json();
    const t = data.team;

    let coach: TeamCoach | null = null;
    if (t.coaches?.length > 0) {
      const c = t.coaches[0];
      coach = { name: `${c.firstName ?? ""} ${c.lastName ?? ""}`.trim(), experience: c.experience ?? null };
    }

    const recordSummary = t.record?.items?.[0]?.summary ?? null;
    const stats = t.record?.items?.[0]?.stats ?? [];
    const wins   = Number(stats.find((s:{name:string}) => s.name === "wins")?.value   ?? recordSummary?.split("-")[0] ?? 0);
    const losses = Number(stats.find((s:{name:string}) => s.name === "losses")?.value ?? recordSummary?.split("-")[2] ?? 0);
    const draws  = Number(stats.find((s:{name:string}) => s.name === "ties")?.value   ?? recordSummary?.split("-")[1] ?? 0);

    return {
      id: t.id, name: t.displayName, shortName: t.shortDisplayName ?? t.displayName,
      abbr: t.abbreviation, logo: t.logos?.[0]?.href ?? null,
      color: t.color ? `#${t.color}` : null, altColor: t.alternateColor ? `#${t.alternateColor}` : null,
      record: recordSummary, wins, draws, losses,
      venue: t.venue?.fullName ?? null, capacity: t.venue?.capacity ?? null,
      leagueName: data.leagues?.[0]?.name ?? leagueId.toUpperCase(), leagueId, coach,
    };
  } catch { return null; }
}

async function fetchRoster(leaguePath:string, teamId:string): Promise<Athlete[]> {
  try {
    const sport = leaguePath.split("/")[0];
    const hasCdn = ["basketball","football","hockey","baseball"].includes(sport);
    const res = await fetch(`${ESPN}/${leaguePath}/teams/${teamId}/roster`);
    if (!res.ok) return [];
    const data = await res.json();
    const athletes: Athlete[] = [];
    for (const entry of (data.athletes ?? [])) {
      // ESPN soccer groups players by position at the entry level (e.g. "Goalkeepers", "Defenders")
      // Individual items may not have their own position — fall back to the group position
      const groupPos = entry.position;
      const groupPosAbbr = typeof groupPos === "string" ? groupPos : (groupPos?.abbreviation ?? "?");
      const groupPosName = typeof groupPos === "object" && groupPos ? (groupPos.name ?? groupPosAbbr) : groupPosAbbr;

      const items = entry.items?.length ? entry.items : [entry];
      for (const item of items) {
        if (!item.id && !item.displayName) continue;
        const posObj = item.position;
        // Use item-level position if it exists, otherwise inherit from group
        const posAbbr = posObj
          ? (typeof posObj === "string" ? posObj : (posObj?.abbreviation ?? groupPosAbbr))
          : groupPosAbbr;
        const posName = posObj
          ? (typeof posObj === "object" && posObj ? (posObj.name ?? posAbbr) : posAbbr)
          : groupPosName;
        const headshot = item.headshot?.href ?? (hasCdn && item.id ? `https://a.espncdn.com/i/headshots/${sport}/players/full/${item.id}.png` : null);
        athletes.push({
          id: item.id ?? String(Math.random()), name: item.displayName ?? item.fullName ?? "",
          jersey: item.jersey ?? "", position: posName,
          positionAbbr: (posAbbr.length <= 3 ? posAbbr : posAbbr.slice(0, 3)).toUpperCase(),
          headshot, age: item.age ?? null,
          nationality: item.citizenship ?? item.birthPlace?.country ?? null,
          flagUrl: item.flag?.href ?? null,
        });
      }
    }
    // Sort by jersey number ascending — lower numbers are traditionally starters
    return athletes.sort((a, b) => (parseInt(a.jersey) || 999) - (parseInt(b.jersey) || 999));
  } catch { return []; }
}


// ─── Formation Pitch Component ────────────────────────────────────────────────

/** Returns a 0–100 lateral weight: 0 = far left, 100 = far right */
function lateralWeight(p: Athlete): number {
  // 1) Check position abbreviation (works if ESPN returns CB/LB/RB etc.)
  const abbr = p.positionAbbr.toUpperCase();
  const byAbbr: Record<string, number> = {
    // Defenders — left to right
    "LWB": 5,  "LB": 12,
    "LCB": 35, "CB": 50, "SW": 50, "RCB": 65,
    "RB":  88, "RWB": 95,
    // Midfielders — left to right
    "LM":  15, "CDM": 48, "CM": 50, "DM": 50, "CAM": 52, "AM": 50, "MF": 50, "RM": 85,
    // Wingers & forwards — left to right
    "LWF": 8,  "LW": 10,
    "CF":  50, "ST": 50, "SS": 50, "F": 50,
    "RW":  90, "RWF": 92,
  };
  if (byAbbr[abbr] !== undefined) return byAbbr[abbr];

  // 2) Check full position name for lateral keywords
  const name = p.position.toLowerCase();
  if (name.includes("left"))    return 12;
  if (name.includes("right"))   return 88;
  if (name.includes("centre") || name.includes("center") || name.includes("central")) return 50;

  // 3) Fall back to jersey number as a rough positional proxy
  // Traditional: 2=RB→right, 3=LB→left, 4/5=CB→center, 6=CM, 7=RW, 8=CM, 9=ST, 10=CAM, 11=LW
  const jn = parseInt(p.jersey);
  if (!isNaN(jn)) {
    const jerseyMap: Record<number, number> = {
      2: 88, 3: 12, 4: 45, 5: 55, 6: 50,
      7: 88, 8: 45, 9: 50, 10: 55, 11: 12,
    };
    if (jerseyMap[jn] !== undefined) return jerseyMap[jn];
    // For squad numbers 12+, spread them based on modulo
    return 25 + (jn % 8) * 7;
  }

  return 50; // default center
}

function sortLateral(players: Athlete[]): Athlete[] {
  return [...players].sort((a, b) => {
    const diff = lateralWeight(a) - lateralWeight(b);
    if (diff !== 0) return diff;
    // tie-break by jersey number ascending
    return (parseInt(a.jersey) || 99) - (parseInt(b.jersey) || 99);
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PitchView({ roster, teamColor }: { roster: Athlete[]; teamColor: string }) {
  // When using actual match lineup (11 players), show all of them; otherwise guess from full roster
  const isLineup = roster.length <= 14;
  const gk  = roster.filter(p => POS_GK.has(p.positionAbbr)).slice(0, 1);
  const def = sortLateral(isLineup
    ? roster.filter(p => POS_DEF.has(p.positionAbbr))
    : roster.filter(p => POS_DEF.has(p.positionAbbr)).slice(0, 4));
  const fwd = sortLateral(isLineup
    ? roster.filter(p => POS_FWD.has(p.positionAbbr))
    : roster.filter(p => POS_FWD.has(p.positionAbbr)).slice(0, 5));
  const midCount = isLineup
    ? roster.filter(p => POS_MID.has(p.positionAbbr)).length
    : Math.max(2, 10 - def.length - fwd.length);
  const mid = sortLateral(roster.filter(p => POS_MID.has(p.positionAbbr)).slice(0, midCount));
  const formation = `${def.length}-${mid.length}-${fwd.length}`;

  const PW = 560; const PH = 780; const PX = 20; const PY = 20;
  const color = teamColor && teamColor !== "#ffffff" ? teamColor : "#1565c0";

  // Position players using actual lateral weight as x-axis percentage
  // This mirrors real football diagrams: LW hugs left touchline, RW right, ST center, etc.
  function placeRow(players: Athlete[], y: number) {
    if (players.length === 0) return [];
    return players.map(p => ({
      ...p,
      cx: PX + (lateralWeight(p) / 100) * PW,
      cy: PY + y,
    }));
  }

  const placed = [
    ...placeRow(gk,  PH - 55),
    ...placeRow(def, PH * 0.72),
    ...placeRow(mid, PH * 0.48),
    ...placeRow(fwd, PH * 0.23),
  ];

  const totalW = PW + PX * 2;
  const totalH = PH + PY * 2;
  const stripeH = PH / 8;

  return (
    <div className={styles.pitchWrap}>
      <div className={styles.formationBadge}>{formation} Formation</div>
      <svg viewBox={`0 0 ${totalW} ${totalH}`} className={styles.pitchSvg} aria-label="Formation pitch">
        {/* Pitch bg stripes */}
        {Array.from({ length: 8 }, (_, i) => (
          <rect key={i} x={PX} y={PY + i * stripeH} width={PW} height={stripeH}
            fill={i % 2 === 0 ? "#2a7a45" : "#2e8a4e"} />
        ))}
        {/* Pitch border */}
        <rect x={PX} y={PY} width={PW} height={PH} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={2} />
        {/* Halfway line */}
        <line x1={PX} y1={PY + PH / 2} x2={PX + PW} y2={PY + PH / 2} stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
        {/* Center circle */}
        <circle cx={PX + PW / 2} cy={PY + PH / 2} r={62} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
        <circle cx={PX + PW / 2} cy={PY + PH / 2} r={3} fill="rgba(255,255,255,0.6)" />
        {/* Top penalty area */}
        <rect x={PX + PW * 0.18} y={PY} width={PW * 0.64} height={PH * 0.20} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
        <rect x={PX + PW * 0.33} y={PY} width={PW * 0.34} height={PH * 0.10} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
        <rect x={PX + PW * 0.38} y={PY - 8} width={PW * 0.24} height={8} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />
        {/* Bottom penalty area */}
        <rect x={PX + PW * 0.18} y={PY + PH * 0.80} width={PW * 0.64} height={PH * 0.20} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
        <rect x={PX + PW * 0.33} y={PY + PH * 0.90} width={PW * 0.34} height={PH * 0.10} fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth={1.5} />
        <rect x={PX + PW * 0.38} y={PY + PH} width={PW * 0.24} height={8} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={2} />

        {/* Players */}
        {placed.map((p) => {
          const surname = p.name.split(" ").slice(-1)[0]?.slice(0, 11) ?? p.name.slice(0, 11);
          const posLabel = p.positionAbbr !== "?" ? p.positionAbbr : "";
          return (
            <g key={p.id}>
              {/* Shadow */}
              <ellipse cx={p.cx} cy={p.cy + 28} rx={18} ry={5} fill="rgba(0,0,0,0.25)" />
              {/* Circle */}
              <circle cx={p.cx} cy={p.cy} r={24} fill={color} stroke="#fff" strokeWidth={2.5} />
              {/* Jersey number */}
              <text x={p.cx} y={p.cy + 3} textAnchor="middle" dominantBaseline="middle"
                fontSize={13} fontWeight={800} fill="#fff" fontFamily="monospace">
                {p.jersey || "?"}
              </text>
              {/* Position label */}
              {posLabel && (
                <text x={p.cx} y={p.cy - 12} textAnchor="middle" dominantBaseline="middle"
                  fontSize={7} fontWeight={700} fill="rgba(255,255,255,0.75)" fontFamily="monospace"
                  letterSpacing="0.5">
                  {posLabel}
                </text>
              )}
              {/* Name plate */}
              <rect x={p.cx - 34} y={p.cy + 30} width={68} height={16} rx={4} fill="rgba(0,0,0,0.65)" />
              <text x={p.cx} y={p.cy + 38} textAnchor="middle" dominantBaseline="middle"
                fontSize={9} fontWeight={600} fill="#fff" fontFamily="sans-serif">
                {surname}
              </text>
            </g>
          );
        })}

        {/* Position labels */}
        {[
          { label: "GK", y: PY + PH - 55 },
          { label: "DEF", y: PY + PH * 0.70 },
          { label: "MID", y: PY + PH * 0.47 },
          { label: "FWD", y: PY + PH * 0.24 },
        ].map(({ label, y }) => (
          <text key={label} x={PX + 6} y={y} fontSize={9} fontWeight={700}
            fill="rgba(255,255,255,0.45)" fontFamily="monospace" dominantBaseline="middle">
            {label}
          </text>
        ))}
      </svg>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabId = "squad" | "honours" | "club";

export default function TeamDetailPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const teamId   = params.id as string;
  const leagueId = searchParams.get("league") ?? "eng.1";
  const leaguePath = LEAGUE_PATHS[leagueId] ?? "soccer/eng.1";

  const [team,      setTeam]      = useState<TeamDetail | null>(null);
  const [roster,    setRoster]    = useState<Athlete[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("squad");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    Promise.all([
      fetchTeamDetail(leaguePath, teamId, leagueId),
      fetchRoster(leaguePath, teamId),
    ]).then(([teamData, rosterData]) => {
      setTeam(teamData);
      setRoster(rosterData);
      setLoading(false);
    });
  }, [leaguePath, teamId, leagueId]);

  // Group roster by position
  const byPos: Record<string, Athlete[]> = {};
  for (const a of roster) {
    const k = a.positionAbbr || "?";
    if (!byPos[k]) byPos[k] = [];
    byPos[k].push(a);
  }
  const ordered  = POSITIONS_ORDER.filter(p => byPos[p]).map(p => ({ abbr: p, label: byPos[p][0].position || p, players: byPos[p] }));
  const extra    = Object.keys(byPos).filter(p => !POSITIONS_ORDER.includes(p)).map(p => ({ abbr: p, label: byPos[p][0].position || p, players: byPos[p] }));
  const positionGroups = [...ordered, ...extra];

  const achievements = team ? (TEAM_ACHIEVEMENTS[team.name] ?? []) : [];
  const legends      = team ? (CLUB_LEGENDS[team.name] ?? []) : [];
  const clubExtra    = team ? (CLUB_INFO_EXTRA[team.name] ?? null) : null;
  const bgColor      = team?.color ?? "#1a2030";

  const tabs: {id: TabId; label: string; icon: React.ReactNode}[] = [
    { id: "squad",   label: `Squad (${roster.length})`, icon: <Users size={14} strokeWidth={2}/> },
    { id: "honours", label: "Honours",                  icon: <Trophy size={14} strokeWidth={2}/> },
    { id: "club",    label: "Club",                     icon: <Info size={14} strokeWidth={2}/> },
  ];

  return (
    <AppShell active="teams" title={team?.name ?? "Team"} subtitle={team?.leagueName ?? "Loading..."}>
      <div className="stack">
        <Link href="/teams" className={styles.back}>
          <ChevronLeft size={16} strokeWidth={2.5} /> All Teams
        </Link>

        {loading ? (
          <>
            <div className="skeleton-row" style={{height:160,borderRadius:16,marginBottom:12}}/>
            <div className="skeleton-row" style={{height:400,borderRadius:16}}/>
          </>
        ) : team ? (
          <>
            {/* ── Hero ── */}
            <div className={styles.hero} style={{background:`linear-gradient(135deg, ${bgColor}ee, ${bgColor}77)`}}>
              <div className={styles.heroBg}/>
              {team.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={team.logo} alt={team.name} width={96} height={96}
                  style={{objectFit:"contain",filter:"drop-shadow(0 4px 16px rgba(0,0,0,0.5))",position:"relative",zIndex:1}}/>
              ) : (
                <div className="crest" style={{width:96,height:96,fontSize:30,position:"relative",zIndex:1}}>{team.abbr}</div>
              )}
              <div className={styles.heroInfo}>
                <h1 className={styles.heroName}>{team.name}</h1>
                {clubExtra?.nickname && <div className={styles.heroNickname}>&ldquo;{clubExtra.nickname}&rdquo;</div>}
                <div className={styles.heroMeta}>
                  <span className={styles.heroBadge}>{team.leagueName}</span>
                  {team.record && <span className={styles.heroBadge}>{team.record}</span>}
                  {clubExtra?.founded && <span className={styles.heroBadge}>Est. {clubExtra.founded}</span>}
                </div>
                {team.venue && (
                  <div className={styles.heroVenue}>
                    <MapPin size={12} strokeWidth={2}/> {team.venue}
                    {team.capacity && <span style={{opacity:0.6}}> · {team.capacity.toLocaleString()} cap.</span>}
                  </div>
                )}
              </div>
            </div>

            {/* ── Season Stats Row ── */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <span className={styles.statNum} style={{color:"#4ade80"}}>{team.wins}</span>
                <span className={styles.statLabel}>Wins</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum} style={{color:"var(--text-dim)"}}>{team.draws}</span>
                <span className={styles.statLabel}>Draws</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum} style={{color:"#f87171"}}>{team.losses}</span>
                <span className={styles.statLabel}>Losses</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statNum}>{roster.length}</span>
                <span className={styles.statLabel}>Players</span>
              </div>
              {achievements.length > 0 && (
                <div className={styles.statCard}>
                  <span className={styles.statNum} style={{color:"var(--accent)"}}>{achievements.length}</span>
                  <span className={styles.statLabel}>Major Titles</span>
                </div>
              )}
            </div>

            {/* ── Tabs ── */}
            <div className={styles.tabs}>
              {tabs.map(t => (
                <button key={t.id} className={`${styles.tab}${activeTab===t.id?" "+styles.tabActive:""}`}
                  onClick={() => setActiveTab(t.id)}>
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            {/* ── Squad Tab ── */}
            {activeTab === "squad" && (
              <div className={styles.squadSection}>
                {positionGroups.length === 0 ? (
                  <p style={{color:"var(--text-mute)",textAlign:"center",padding:"32px 0",fontSize:13}}>Squad data not available.</p>
                ) : positionGroups.map(({ abbr, label, players }) => (
                  <div key={abbr} className={styles.posGroup}>
                    <div className={styles.posLabel}>
                      <Shield size={12} strokeWidth={2}/> {label}
                      <span className={styles.posCount}>{players.length}</span>
                    </div>
                    <div className={styles.playersList}>
                      {players.map(p => (
                        <Link key={p.id} href={`/players/${p.id}?league=${leagueId}`} className={styles.playerRow}>
                          <span className={styles.jerseyNum}>{p.jersey || "—"}</span>
                          {p.headshot ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.headshot} alt={p.name} width={34} height={34} className={styles.playerAvatar}
                              onError={e => { const el = e.target as HTMLImageElement; el.style.display="none"; const sib = el.nextSibling as HTMLElement|null; if (sib?.style) sib.style.display="flex"; }}/>
                          ) : null}
                          <div className={styles.playerAvatarFallback} style={{display:p.headshot?"none":"flex"}}>
                            {p.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2)}
                          </div>
                          <div className={styles.playerInfo}>
                            <span className={styles.playerName}>{p.name}</span>
                            <div style={{display:"flex",alignItems:"center",gap:6}}>
                              {p.flagUrl && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={p.flagUrl} alt="" width={14} height={10} style={{objectFit:"cover",borderRadius:1}}/>
                              )}
                              {p.nationality && <span className={styles.playerNat}>{p.nationality}</span>}
                              {p.age && <span className={styles.playerAge}>{p.age}y</span>}
                            </div>
                          </div>
                          <span className={styles.playerPosTag}>{p.positionAbbr}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}


            {/* ── Honours Tab ── */}
            {activeTab === "honours" && (
              <div className={styles.achievementsSection}>
                {achievements.length === 0 ? (
                  <div style={{padding:"32px 20px",textAlign:"center"}}>
                    <Trophy size={40} style={{color:"var(--text-mute)",marginBottom:12}}/>
                    <p style={{color:"var(--text-mute)",fontSize:13}}>Honours data not available for {team.name}.</p>
                  </div>
                ) : (
                  <div className={styles.achievementsList}>
                    {(["League","Cup","European","World"] as const).map(cat => {
                      const items = achievements.filter(a => a.category === cat);
                      if (!items.length) return null;
                      return (
                        <div key={cat}>
                          <div className={styles.achieveCatLabel}>{cat}</div>
                          {items.map((a, i) => (
                            <div key={i} className={styles.achievementRow}>
                              <Star size={16} strokeWidth={2} style={{color:"var(--accent)",flexShrink:0}}/>
                              <span>{a.title}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── Club Tab ── */}
            {activeTab === "club" && (
              <div className={styles.clubSection}>

                {/* Club Info */}
                <div className={styles.clubInfoGrid}>
                  {clubExtra?.founded && (
                    <div className={styles.clubInfoCard}>
                      <div className={styles.clubInfoIcon}><Calendar size={18} strokeWidth={2}/></div>
                      <div><div className={styles.clubInfoLabel}>Founded</div><div className={styles.clubInfoValue}>{clubExtra.founded}</div></div>
                    </div>
                  )}
                  {team.venue && (
                    <div className={styles.clubInfoCard}>
                      <div className={styles.clubInfoIcon}><Building2 size={18} strokeWidth={2}/></div>
                      <div>
                        <div className={styles.clubInfoLabel}>Stadium</div>
                        <div className={styles.clubInfoValue}>{team.venue}</div>
                        {team.capacity && <div className={styles.clubInfoSub}>{team.capacity.toLocaleString()} capacity</div>}
                      </div>
                    </div>
                  )}
                  {clubExtra?.owner && (
                    <div className={styles.clubInfoCard}>
                      <div className={styles.clubInfoIcon}><Award size={18} strokeWidth={2}/></div>
                      <div><div className={styles.clubInfoLabel}>Owner / Investor</div><div className={styles.clubInfoValue}>{clubExtra.owner}</div></div>
                    </div>
                  )}
                  {clubExtra?.nickname && (
                    <div className={styles.clubInfoCard}>
                      <div className={styles.clubInfoIcon}><Star size={18} strokeWidth={2}/></div>
                      <div><div className={styles.clubInfoLabel}>Nickname</div><div className={styles.clubInfoValue}>{clubExtra.nickname}</div></div>
                    </div>
                  )}
                </div>

                {/* Manager */}
                {team.coach && (
                  <div className={styles.managerSection}>
                    <div className={styles.sectionHeader}>Manager</div>
                    <div className={styles.managerCard}>
                      <div className={styles.managerAvatar}>
                        {team.coach.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div className={styles.managerInfo}>
                        <div className={styles.managerName}>{team.coach.name}</div>
                        <div className={styles.managerRole}>Head Coach</div>
                        {team.coach.experience !== null && team.coach.experience > 0 && (
                          <div className={styles.managerExp}>{team.coach.experience} season{team.coach.experience !== 1 ? "s" : ""} experience</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Club Legends */}
                {legends.length > 0 && (
                  <div className={styles.legendsSection}>
                    <div className={styles.sectionHeader}>Club Legends</div>
                    <div className={styles.legendsGrid}>
                      {legends.map((l, i) => (
                        <div key={i} className={styles.legendCard}>
                          <div className={styles.legendAvatar}>
                            {l.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                          </div>
                          <div className={styles.legendInfo}>
                            <div className={styles.legendName}>{l.name}</div>
                            <div className={styles.legendRole}>{l.role}</div>
                            <div className={styles.legendPeriod}>{l.period}</div>
                            <div className={styles.legendNat}>{l.nationality}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback if no club data */}
                {!clubExtra && !team.coach && legends.length === 0 && (
                  <div style={{textAlign:"center",padding:"40px 20px",color:"var(--text-mute)",fontSize:13}}>
                    <Info size={32} style={{marginBottom:12,opacity:0.4}}/>
                    <p>Detailed club info not yet available.</p>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p style={{color:"var(--text-mute)",textAlign:"center",padding:"48px 0"}}>Team not found.</p>
        )}
      </div>
    </AppShell>
  );
}
