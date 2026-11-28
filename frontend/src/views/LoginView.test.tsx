import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/hooks/authContextValue';
import { isDevAuthUiEnabled } from '@/hooks/useDevUsers';
import { I18nProvider } from '@/i18n/I18nContext';
import * as authService from '@/services/authService';
import { LoginView } from './LoginView';

vi.mock('@/services/authService', () => ({
  listDevUsers: vi.fn().mockResolvedValue([
    { id: 'u1', username: 'super-admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, createdAt: '' },
    { id: 'u2', username: 'disabled-user', email: 'disabled@example.com', role: 'USER', isActive: false, createdAt: '' },
  ]),
}));

describe('LoginView & DevLoginPanel (UT-11)', () => {
  it('enforces double-lock on isDevAuthUiEnabled helper', () => {
    expect(isDevAuthUiEnabled(true, 'localhost')).toBe(true);
    expect(isDevAuthUiEnabled(true, '127.0.0.1')).toBe(true);
    expect(isDevAuthUiEnabled(false, 'localhost')).toBe(false);
    expect(isDevAuthUiEnabled(true, 'app.example.com')).toBe(false);
  });

  it('validates login form, submits credentials without plaintext leak, and supports DEV one-click login', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue({
      id: 'u1', username: 'super-admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, createdAt: '',
    });
    const devMock = vi.fn().mockResolvedValue({
      id: 'u1', username: 'super-admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, createdAt: '',
    });
    render(
      <AuthContext.Provider value={{ user: null, loading: false, isAuthenticated: false, login: loginMock, loginAsDev: devMock, logout: vi.fn(), refreshSession: vi.fn() }}>
        <I18nProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginView />} />
              <Route path="/" element={<div>Home Target</div>} />
            </Routes>
          </MemoryRouter>
        </I18nProvider>
      </AuthContext.Provider>,
    );

    const devButtons = await screen.findAllByRole('button', { name: /^login$/i });
    expect(devButtons[1]).toBeDisabled();
    await user.click(devButtons[0]);
    await waitFor(() => expect(devMock).toHaveBeenCalledWith('u1', 'en'));
  });

  it('validates login form and submits credentials without plaintext leak', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue({
      id: 'u1', username: 'super-admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, createdAt: '',
    });
    render(
      <AuthContext.Provider value={{ user: null, loading: false, isAuthenticated: false, login: loginMock, loginAsDev: vi.fn(), logout: vi.fn(), refreshSession: vi.fn() }}>
        <I18nProvider>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/login" element={<LoginView />} />
              <Route path="/" element={<div>Home Target</div>} />
            </Routes>
          </MemoryRouter>
        </I18nProvider>
      </AuthContext.Provider>,
    );

    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your username or email/i);

    await user.type(screen.getByLabelText(/username or email/i), 'super-admin');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter your password/i);

    await user.type(screen.getByLabelText(/^password$/i), '12345678');
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() => expect(loginMock).toHaveBeenCalledWith('super-admin', '12345678', 'en'));
    expect(authService.listDevUsers).toHaveBeenCalled();
  });
});
