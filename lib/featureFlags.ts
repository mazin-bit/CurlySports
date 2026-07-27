export interface AdminFlags {
  maintenanceMode: boolean;
  maintenanceMessage: string;
  maintenanceEstimated: string;
  siteNoticeEnabled: boolean;
  siteNotice: string;
  sports: Record<string, boolean>;
  features: Record<string, boolean>;
  pageViews: Record<string, number>;
  activityLog: { action: string; at: string }[];
}

export const DEFAULT_FLAGS: AdminFlags = {
  maintenanceMode: false,
  maintenanceMessage: "We're making some improvements. We'll be right back!",
  maintenanceEstimated: "",
  siteNoticeEnabled: false,
  siteNotice: "",
  sports: {
    football: true,
    basketball: true,
    nfl: true,
    tennis: true,
    baseball: true,
    f1: true,
    cricket: true,
    hockey: true,
    golf: true,
    boxing: true,
    mma: true,
  },
  features: {
    liveScores: true,
    news: true,
    funZone: true,
    miniGames: true,
    leagues: true,
    players: true,
    teams: true,
    favorites: true,
    redeemCodes: true,
    challenges: false,
  },
  pageViews: {},
  activityLog: [],
};
