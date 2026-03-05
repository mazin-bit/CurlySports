export const ROLES = {
  MEMBER: 'member',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export interface JWTPayload {
  sub: string;
  email?: string;
  role: Role;
  iat?: number;
  exp?: number;
}

export interface UserSession {
  uid: string;
  email: string | null;
  role: Role;
  displayName?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorEmail: string;
  action: string;
  resource?: string;
  details?: Record<string, unknown>;
}
