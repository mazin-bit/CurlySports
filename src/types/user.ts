export type Role = 'super_admin' | 'admin' | 'member';
export type UserStatus = 'active' | 'suspended' | 'banned';

export interface ContentTypePreferences {
  news?: boolean;
  matchReports?: boolean;
  transferNews?: boolean;
  liveScores?: boolean;
  playerStats?: boolean;
  videos?: boolean;
}

export interface SportSurveyData {
  favoriteTeams: string[];
  favoritePlayers: (string | number)[];
  contentTypes: ContentTypePreferences;
}

export interface SurveyInterests {
  sports?: Record<string, SportSurveyData>;
  favoriteTeams?: string[];
  favoriteLeagues?: string[];
  favoritePlayers?: (string | number)[];
  contentTypes?: ContentTypePreferences;
}

export interface UserProfile {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  provider?: string;
  role: Role;
  status?: UserStatus;
  currentStreak?: number;
  longestStreak?: number;
  lastLoginDate?: string;
  lastSeen?: string;
  favoriteClubs?: string[];
  favoritePlayers?: (string | number)[];
  bookedTickets?: Record<string, unknown>;
  penaltyBest?: number;
  superOverBest?: number;
  surveyInterests?: SurveyInterests;
  surveyCompleted?: boolean;
  surveySkipped?: boolean;
}
