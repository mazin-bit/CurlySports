/**
 * Ergast F1 API Scraper (OFFICIAL FREE API)
 *
 * The Ergast Developer API (ergast.com/mrd) is a public, free, officially
 * maintained API providing comprehensive F1 data since 1950.
 * Returns JSON when you append .json to endpoints.
 *
 * NOTE: Ergast was deprecated in 2024 Q4 but data remains accessible.
 * Use OpenF1 for real-time race data; Ergast for historical/reference.
 *
 * No auth required. Rate limit: generous (~4 req/s).
 */

import { fetchJson } from "@/scrapers/base";

const BASE = "https://ergast.com/api/f1";

interface ErgastRace {
  season: string;
  round: string;
  url: string;
  raceName: string;
  Circuit: {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: { lat: string; long: string; locality: string; country: string };
  };
  date: string;
  time?: string;
  FirstPractice?: { date: string; time: string };
  SecondPractice?: { date: string; time: string };
  ThirdPractice?: { date: string; time: string };
  Qualifying?: { date: string; time: string };
  Sprint?: { date: string; time: string };
}

interface ErgastResult {
  number: string;
  position: string;
  positionText: string;
  points: string;
  Driver: {
    driverId: string;
    permanentNumber?: string;
    code: string;
    url: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructor: {
    constructorId: string;
    url: string;
    name: string;
    nationality: string;
  };
  grid: string;
  laps: string;
  status: string;
  Time?: { millis?: string; time: string };
  FastestLap?: { rank: string; lap: string; Time: { time: string }; AverageSpeed: { units: string; speed: string } };
}

interface ErgastStanding {
  position: string;
  positionText: string;
  points: string;
  wins: string;
  Driver?: {
    driverId: string;
    code: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
  };
  Constructors?: { constructorId: string; name: string; nationality: string }[];
  Constructor?: { constructorId: string; name: string; nationality: string };
}

export class ErgastScraper {
  /** Full race schedule for a season */
  async fetchSchedule(year: number | "current" = "current"): Promise<ErgastRace[]> {
    const data = await fetchJson<{
      MRData: { RaceTable: { Races?: ErgastRace[] } };
    }>(`${BASE}/${year}.json?limit=30`);
    return data?.MRData?.RaceTable?.Races ?? [];
  }

  /** Race results for a specific round */
  async fetchRaceResults(year: number | "current", round: number | "last"): Promise<ErgastResult[]> {
    const data = await fetchJson<{
      MRData: { RaceTable: { Races?: { Results?: ErgastResult[] }[] } };
    }>(`${BASE}/${year}/${round}/results.json`);
    return data?.MRData?.RaceTable?.Races?.[0]?.Results ?? [];
  }

  /** Driver championship standings */
  async fetchDriverStandings(year: number | "current" = "current"): Promise<{
    position: number;
    driver: string;
    driverCode: string;
    nationality: string;
    team: string;
    wins: number;
    points: number;
  }[]> {
    const data = await fetchJson<{
      MRData: {
        StandingsTable: {
          StandingsLists?: { DriverStandings?: ErgastStanding[] }[];
        };
      };
    }>(`${BASE}/${year}/driverStandings.json`);

    return (data?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings ?? []).map((s) => ({
      position: parseInt(s.position),
      driver: s.Driver ? `${s.Driver.givenName} ${s.Driver.familyName}` : "",
      driverCode: s.Driver?.code ?? "",
      nationality: s.Driver?.nationality ?? "",
      team: s.Constructors?.[0]?.name ?? "",
      wins: parseInt(s.wins),
      points: parseFloat(s.points),
    }));
  }

  /** Constructor championship standings */
  async fetchConstructorStandings(year: number | "current" = "current") {
    const data = await fetchJson<{
      MRData: {
        StandingsTable: {
          StandingsLists?: { ConstructorStandings?: ErgastStanding[] }[];
        };
      };
    }>(`${BASE}/${year}/constructorStandings.json`);
    return data?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings ?? [];
  }

  /** Qualifying results */
  async fetchQualifyingResults(year: number | "current", round: number | "last") {
    const data = await fetchJson<{
      MRData: {
        RaceTable: {
          Races?: {
            QualifyingResults?: {
              position: string;
              Driver: { code: string; givenName: string; familyName: string };
              Constructor: { name: string };
              Q1?: string; Q2?: string; Q3?: string;
            }[];
          }[];
        };
      };
    }>(`${BASE}/${year}/${round}/qualifying.json`);
    return data?.MRData?.RaceTable?.Races?.[0]?.QualifyingResults ?? [];
  }

  /** Lap times for a driver in a race */
  async fetchLapTimes(year: number, round: number, driverId: string) {
    const data = await fetchJson<{
      MRData: {
        RaceTable: {
          Races?: {
            Laps?: {
              number: string;
              Timings?: { driverId: string; position: string; time: string }[];
            }[];
          }[];
        };
      };
    }>(`${BASE}/${year}/${round}/drivers/${driverId}/laps.json?limit=100`);
    return data?.MRData?.RaceTable?.Races?.[0]?.Laps ?? [];
  }

  /** All races where a driver had the fastest lap */
  async fetchDriverInfo(driverId: string) {
    const data = await fetchJson(`${BASE}/drivers/${driverId}.json`);
    return data;
  }
}
