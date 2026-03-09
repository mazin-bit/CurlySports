import React from 'react';
import { isAtLeast } from '../auth/roles';

interface RequireRoleProps {
  userRole: string | null;
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireRole({ userRole, allowedRoles, children, fallback = null }: RequireRoleProps) {
  if (!userRole || !Array.isArray(allowedRoles) || allowedRoles.length === 0) {
    return <>{fallback}</>;
  }
  const allowed = allowedRoles.some((r) => r === userRole || isAtLeast(userRole, r));
  return <>{allowed ? children : fallback}</>;
}

interface RequireAtLeastProps {
  role: string | null;
  minimum: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireAtLeast({ role, minimum, children, fallback = null }: RequireAtLeastProps) {
  if (!role || !minimum) return <>{fallback}</>;
  return <>{isAtLeast(role, minimum) ? children : fallback}</>;
}

export default RequireRole;
