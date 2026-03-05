import { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { getUserData } from '../firebase';
import { ROLES, hasPermission, isAtLeast } from './roles';

/**
 * Hook: current user's role and permissions.
 * Returns { role, permissions, loading, can(permission), isAtLeast(minRole) }.
 */
export function useUserRole() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setRole(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await getUserData(firebaseUser.uid);
        const r = data?.role;
        if (r === ROLES.SUPER_ADMIN || r === ROLES.ADMIN || r === ROLES.MEMBER) {
          setRole(r);
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
    return () => unsubscribe();
  }, []);

  const can = (permission) => hasPermission(role, permission);
  const atLeast = (minRole) => isAtLeast(role, minRole);

  return {
    role,
    loading,
    can,
    isAtLeast: atLeast,
  };
}

export default useUserRole;
