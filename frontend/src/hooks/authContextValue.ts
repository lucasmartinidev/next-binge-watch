import { createContext } from 'react';
import type { AuthUser } from '@/types/auth';
import type { Locale } from '@/types/locale';

export type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (identifier: string, password: string, locale: Locale) => Promise<AuthUser>;
  loginAsDev: (userId: string, locale: Locale) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
