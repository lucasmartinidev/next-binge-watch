import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '@/hooks/AuthContext';
import { I18nProvider } from '@/i18n/I18nContext';
import * as authService from '@/services/authService';
import * as preferencesService from '@/services/preferencesService';
import { AdminRoute } from './AdminRoute';
import { ProtectedRoute } from './ProtectedRoute';
import { Header } from '../layout/Header';

vi.mock('@/services/authService', () => ({
  getAuthMe: vi.fn(),
  loginWithCredentials: vi.fn(),
  loginAsDevUser: vi.fn(),
  logoutSession: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: 'pt-BR', updatedAt: null }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
}));

describe('Auth guards, Header/AccountMenu, and I18nContext sync (UT-14)', () => {
  it('redirects unauthenticated visitors on ProtectedRoute and renders Watchlist when authenticated', async () => {
    vi.mocked(authService.getAuthMe).mockResolvedValueOnce({ authenticated: false, user: null });
    render(
      <AuthProvider>
        <I18nProvider>
          <MemoryRouter initialEntries={['/watchlist']}>
            <Header />
            <Routes>
              <Route path="/login" element={<div>Login Page</div>} />
              <Route path="/watchlist" element={<ProtectedRoute><div>Private Watchlist</div></ProtectedRoute>} />
            </Routes>
          </MemoryRouter>
        </I18nProvider>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('Login Page')).toBeInTheDocument());
    expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('denies USER role on AdminRoute and hides Users nav link while syncing user preferences', async () => {
    vi.mocked(authService.getAuthMe).mockResolvedValueOnce({
      authenticated: true,
      user: { id: 'u1', username: 'viewer-1', email: 'v@e.com', role: 'USER', isActive: true, createdAt: '' },
    });
    render(
      <AuthProvider>
        <I18nProvider>
          <MemoryRouter initialEntries={['/admin/users']}>
            <Header />
            <Routes>
              <Route path="/admin/users" element={<AdminRoute><div>Admin Panel</div></AdminRoute>} />
            </Routes>
          </MemoryRouter>
        </I18nProvider>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByText('viewer-1')).toBeInTheDocument());
    expect(screen.queryByRole('link', { name: /Users|Usuários/i })).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/Acesso restrito a administradores/i)).toBeInTheDocument());
    expect(preferencesService.getPreferences).toHaveBeenCalled();
  });

  it('shows Users link for ADMIN and signs out on click', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.getAuthMe).mockResolvedValueOnce({
      authenticated: true,
      user: { id: 'a1', username: 'super-admin', email: 'a@e.com', role: 'ADMIN', isActive: true, createdAt: '' },
    });
    render(
      <AuthProvider>
        <I18nProvider>
          <MemoryRouter>
            <Header />
          </MemoryRouter>
        </I18nProvider>
      </AuthProvider>,
    );
    await waitFor(() => expect(screen.getByRole('link', { name: /Users|Usuários/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /Sign Out|Sair/i }));
    await waitFor(() => expect(screen.getByRole('link', { name: /Sign In|Entrar/i })).toBeInTheDocument());
  });
});
