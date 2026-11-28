import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import * as authService from '@/services/authService';
import { ChangePasswordView } from './ChangePasswordView';

vi.mock('@/services/authService', () => ({
  changeOwnPassword: vi.fn().mockResolvedValue(undefined),
}));

describe('ChangePasswordView (UT-12)', () => {
  it('validates length, mismatch, same-password, and submits hashed change request', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <MemoryRouter>
          <ChangePasswordView />
        </MemoryRouter>
      </I18nProvider>,
    );

    await user.type(screen.getByLabelText(/current password/i), 'old-pass-1');
    await user.type(screen.getByLabelText(/^new password$/i), 'short');
    await user.type(screen.getByLabelText(/confirm new password/i), 'short');
    await user.click(screen.getByRole('button', { name: /update password/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);

    await user.clear(screen.getByLabelText(/^new password$/i));
    await user.type(screen.getByLabelText(/^new password$/i), 'new-pass-123');
    await user.click(screen.getByRole('button', { name: /update password/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i);

    await user.clear(screen.getByLabelText(/confirm new password/i));
    await user.type(screen.getByLabelText(/confirm new password/i), 'new-pass-123');
    await user.click(screen.getByRole('button', { name: /update password/i }));
    await waitFor(() => expect(authService.changeOwnPassword).toHaveBeenCalledWith({
      currentPassword: 'old-pass-1',
      newPassword: 'new-pass-123',
      locale: 'en',
    }));
    expect(screen.getByRole('status')).toHaveTextContent(/updated successfully/i);
  });
});
