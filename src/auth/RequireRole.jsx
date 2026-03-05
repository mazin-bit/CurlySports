import React from 'react';
import { ROLES, isAtLeast } from '../auth/roles';

/**
 * Renders children only if the user's role is in the allowed list (or higher).
 * Use for route protection or hiding sections.
 * @param {Object} props
 * @param {string} props.userRole - Current user role (e.g. from useUserRole or user.role)
 * @param {string[]} props.allowedRoles - e.g. ['super_admin', 'admin']
 * @param {React.ReactNode} props.children - Content to show when allowed
 * @param {React.ReactNode} props.fallback - Optional content when not allowed (default: null)
 */
export function RequireRole({ userRole, allowedRoles, children, fallback = null }) {
  if (!userRole || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return fallback;
  }
  const allowed = allowedRoles.some((r) => r === userRole || isAtLeast(userRole, r));
  return allowed ? children : fallback;
}

/**
 * Shorthand: require at least one of these roles (by hierarchy: super_admin > admin > member).
 * e.g. requireSuperAdmin = <RequireAtLeast role={userRole} minimum="super_admin" />
 */
export function RequireAtLeast({ role, minimum, children, fallback = null }) {
  if (!role || !minimum) return fallback;
  return isAtLeast(role, minimum) ? children : fallback;
}

export default RequireRole;
