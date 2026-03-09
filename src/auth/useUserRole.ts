import { useState, useEffect } from 'react';
import { onAuthStateChange } from '../services/auth';
import { getUserData } from '../services/database';
import { ROLES, hasPermission, isAtLeast } from './roles';

/**
 * Hook: current user's role and permissions.
 */
export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (_event, _session, user) => {
      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getUserData(user.id);
        const r = data?.role;
        if (r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN || r === ROLES.MEMBER) {
          setRole(r as string);
        } else {
          setRole(ROLES.MEMBER);
        }
      } catch (e) {
        console.error('useUserRole:', e);
        setRole(ROLES.MEMBER);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const can = (permission: string) => hasPermission(role, permission);
  const atLeast = (minRole: string) => isAtLeast(role, minRole);

  return {
    role,
    loading,
    can,
    isAtLeast: atLeast,
  };
}

export default useUserRole;
