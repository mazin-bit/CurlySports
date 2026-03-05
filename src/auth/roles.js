/**
 * Role-Based Access Control (RBAC) for sports analytics.
 * Roles: super_admin | admin | member
 */

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MEMBER: 'member',
};

/** Permissions (granular). Use hasPermission(role, permission). */
export const PERMISSIONS = {
  // Super Admin only
  CREATE_DELETE_ADMINS: 'create_delete_admins',
  MANAGE_ALL_USERS: 'manage_all_users',
  ASSIGN_ROLES: 'assign_roles',
  VIEW_SYSTEM_ANALYTICS: 'view_system_analytics',
  FULL_DATABASE_ACCESS: 'full_database_access',
  CHANGE_SYSTEM_SETTINGS: 'change_system_settings',

  // Admin
  MANAGE_MEMBERS: 'manage_members',
  UPLOAD_EDIT_ANALYTICS: 'upload_edit_analytics',

  // Member
  VIEW_ANALYTICS: 'view_analytics',
  SAVE_DASHBOARDS: 'save_dashboards',
};

/** Map role -> list of permission keys */
const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.CREATE_DELETE_ADMINS,
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_SYSTEM_ANALYTICS,
    PERMISSIONS.FULL_DATABASE_ACCESS,
    PERMISSIONS.CHANGE_SYSTEM_SETTINGS,
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.UPLOAD_EDIT_ANALYTICS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SAVE_DASHBOARDS,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_MEMBERS,
    PERMISSIONS.UPLOAD_EDIT_ANALYTICS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SAVE_DASHBOARDS,
  ],
  [ROLES.MEMBER]: [
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.SAVE_DASHBOARDS,
  ],
};

/**
 * Check if a role has a given permission.
 * @param {string} role - One of ROLES
 * @param {string} permission - One of PERMISSIONS
 * @returns {boolean}
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  const list = ROLE_PERMISSIONS[role];
  return Array.isArray(list) && list.includes(permission);
}

/**
 * Check if role is at least as powerful as another (for UI shortcuts).
 * super_admin > admin > member
 */
export function isAtLeast(role, minimumRole) {
  const order = [ROLES.MEMBER, ROLES.ADMIN, ROLES.SUPER_ADMIN];
  const a = order.indexOf(role);
  const b = order.indexOf(minimumRole);
  return a >= 0 && b >= 0 && a >= b;
}

/**
 * Can this role assign the target role? (e.g. cannot create super_admin unless you are super_admin)
 */
export function canAssignRole(assignerRole, targetRole) {
  if (targetRole === ROLES.SUPER_ADMIN) {
    return assignerRole === ROLES.SUPER_ADMIN;
  }
  if (targetRole === ROLES.ADMIN) {
    return assignerRole === ROLES.SUPER_ADMIN;
  }
  if (targetRole === ROLES.MEMBER) {
    return assignerRole === ROLES.SUPER_ADMIN || assignerRole === ROLES.ADMIN;
  }
  return false;
}

export default {
  ROLES,
  PERMISSIONS,
  hasPermission,
  isAtLeast,
  canAssignRole,
};
