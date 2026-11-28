import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from './authContextValue';

const FALLBACK_AUTH_CONTEXT: AuthContextValue = {
  user: null,
  loading: false,
  isAuthenticated: false,
  login: () => Promise.reject(new Error('AuthProvider missing')),
  loginAsDev: () => Promise.reject(new Error('AuthProvider missing')),
  logout: () => Promise.resolve(),
  refreshSession: () => Promise.resolve(),
};

export function useAuth(): AuthContextValue {
  return useContext(AuthContext) ?? FALLBACK_AUTH_CONTEXT;
}
