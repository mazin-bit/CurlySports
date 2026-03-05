import { type Role, ROLES } from '@/types';

const hierarchy: Record<Role, number> = {
  [ROLES.MEMBER]: 0,
  [ROLES.ADMIN]: 1,
  [ROLES.SUPER_ADMIN]: 2,
};

export function isAtLeast(userRole: Role, required: Role): boolean {
  return hierarchy[userRole] >= hierarchy[required];
}

export function canAccessAdminPanel(role: Role): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

export function canAccessSuperAdminPanel(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

/** Admin can manage users (ban, suspend, reset streak). Cannot promote to Super Admin. */
export function canManageUsers(role: Role): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN;
}

/** Only Super Admin can create/delete admins and assign Super Admin. */
export function canAssignRole(actorRole: Role, targetRole: Role): boolean {
  if (actorRole !== ROLES.SUPER_ADMIN) return false;
  return true;
}

export function canPromoteToSuperAdmin(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function canAccessSystemLogs(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function canAccessFeatureFlags(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function canAccessAuditTrail(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function canAccessHealth(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}

export function canAccessMaintenance(role: Role): boolean {
  return role === ROLES.SUPER_ADMIN;
}
