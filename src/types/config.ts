import type { Role } from './user';

export interface FeatureFlag {
  key: string;
  label: string;
  description: string;
  enabled: boolean;
}

export interface Permission {
  key: string;
  label: string;
  enabled: boolean;
}

export interface SaAdmin {
  id?: string;
  email: string;
  role: Role;
  addedAt?: string;
}

export interface HealthStatus {
  server: string;
  db: string;
  api: string;
  uptime: string;
}

export interface AuditLogEntry {
  id?: string;
  timestamp: string;
  actorEmail?: string;
  action: string;
  resource?: string;
  details?: string;
}

export interface AppConfig {
  featureFlags: FeatureFlag[];
  saAdmins: SaAdmin[];
  permissions: Permission[];
  maintenance: boolean;
  health: HealthStatus;
  auditLog: AuditLogEntry[];
  enabledSports: Record<string, boolean>;
  super_admin_emails?: Record<string, boolean>;
  emailTemplates?: Record<string, string>;
}
