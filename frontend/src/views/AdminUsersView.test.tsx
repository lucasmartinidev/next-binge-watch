import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/hooks/authContextValue';
import { I18nProvider } from '@/i18n/I18nContext';
import * as userService from '@/services/userService';
import { AdminUsersView } from './AdminUsersView';

vi.mock('@/services/userService', () => ({
  listManagedUsers: vi.fn().mockResolvedValue([
    { id: 'admin-1', username: 'super-admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, createdAt: '' },
    { id: 'user-1', username: 'viewer-1', email: 'viewer@example.com', role: 'USER', isActive: true, createdAt: '' },
  ]),
  createManagedUser: vi.fn().mockResolvedValue({
    id: 'user-2', username: 'viewer-2', email: 'v2@example.com', role: 'USER', isActive: true, createdAt: '',
  }),
  updateManagedUser: vi.fn().mockImplementation(async (id: string, patch: { role?: string; isActive?: boolean }) => ({
    id,
    username: id === 'user-1' ? 'viewer-1' : 'viewer-2',
    email: 'viewer@example.com',
    role: patch.role ?? 'USER',
    isActive: patch.isActive ?? true,
    createdAt: '',
  })),
  deleteManagedUser: vi.fn().mockResolvedValue(undefined),
}));

describe('AdminUsersView & CreateUserModal (UT-13)', () => {
  function renderAdminView() {
    return render(
      <AuthContext.Provider value={{
        user: { id: 'admin-1', username: 'super-admin', email: 'admin@example.com', role: 'ADMIN', isActive: true, createdAt: '' },
        loading: false, isAuthenticated: true, login: vi.fn(), loginAsDev: vi.fn(), logout: vi.fn(), refreshSession: vi.fn(),
      }}>
        <I18nProvider>
          <MemoryRouter>
            <AdminUsersView />
          </MemoryRouter>
        </I18nProvider>
      </AuthContext.Provider>,
    );
  }

  it('lists users, disables self controls, validates & creates user, updates status, and confirms delete', async () => {
    const user = userEvent.setup();
    renderAdminView();

    expect(await screen.findByText('super-admin')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete super-admin/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /new user/i }));
    await user.type(screen.getByLabelText(/^username$/i), 'bad_name');
    await user.click(screen.getByRole('button', { name: /create user/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/letters, numbers, and dashes/i);

    await user.clear(screen.getByLabelText(/^username$/i));
    await user.type(screen.getByLabelText(/^username$/i), 'viewer-2');
    await user.type(screen.getByLabelText(/^email$/i), 'bad-email');
    await user.click(screen.getByRole('button', { name: /create user/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i);

    await user.clear(screen.getByLabelText(/^email$/i));
    await user.type(screen.getByLabelText(/^email$/i), 'v2@example.com');
    await user.type(screen.getByLabelText(/^password$/i), 'short');
    await user.click(screen.getByRole('button', { name: /create user/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);

    await user.clear(screen.getByLabelText(/^password$/i));
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.click(screen.getByRole('button', { name: /create user/i }));
    await waitFor(() => expect(userService.createManagedUser).toHaveBeenCalled());
    expect(await screen.findByText('viewer-2')).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/role viewer-1/i), 'ADMIN');
    expect(userService.updateManagedUser).toHaveBeenCalledWith('user-1', { role: 'ADMIN' }, 'en');

    await user.click(screen.getAllByRole('button', { name: /deactivate/i })[1]);
    expect(userService.updateManagedUser).toHaveBeenCalledWith('user-1', { isActive: false }, 'en');

    await user.click(screen.getByRole('button', { name: 'Delete viewer-1' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /delete user/i }));
    await waitFor(() => expect(userService.deleteManagedUser).toHaveBeenCalledWith('user-1', 'en'));
  });
});
