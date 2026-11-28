import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getAuthMe, loginAsDevUser, loginWithCredentials, logoutSession } from '@/services/authService';
import type { AuthUser } from '@/types/auth';
import type { Locale } from '@/types/locale';
import { AuthContext } from './authContextValue';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshSession = useCallback(async () => {
    try { const me = await getAuthMe(); setUser(me.authenticated ? me.user : null); }
    catch { setUser(null); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refreshSession(); }, [refreshSession]);
  const login = useCallback(async (identifier: string, password: string, locale: Locale) => {
    const nextUser = await loginWithCredentials({ identifier, password, locale });
    setUser(nextUser);
    return nextUser;
  }, []);
  const loginAsDev = useCallback(async (userId: string, locale: Locale) => {
    const nextUser = await loginAsDevUser(userId, locale);
    setUser(nextUser);
    return nextUser;
  }, []);
  const logout = useCallback(async () => { await logoutSession().catch(() => undefined); setUser(null); }, []);
  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: Boolean(user), login, loginAsDev, logout, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
