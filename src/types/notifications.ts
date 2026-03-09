export type NotificationType = 'match_start' | 'match_result' | 'goal' | 'player_news' | 'transfer' | 'info';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
  createdAt: unknown;
  link?: string;
  matchId?: string;
  teamName?: string;
  playerId?: string;
}
