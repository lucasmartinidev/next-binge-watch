import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import { ErrorState } from '../common/ErrorState';
import { ApiStatusBadge } from './ApiStatusBadge';
import { FooterAttribution } from './FooterAttribution';
import { Header } from './Header';

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: null, updatedAt: null }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'pt-BR', updatedAt: '2026-11-24T00:00:00Z' }),
}));

vi.mock('@/services/healthService', () => ({
  checkApiHealth: vi.fn().mockResolvedValue(true),
}));

describe('Layout and common components (UT-13)', () => {
  it('renders ApiStatusBadge with accessible status text for online, offline, and checking', () => {
    const { rerender } = render(
      <I18nProvider>
        <ApiStatusBadge status="online" />
      </I18nProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/API Online/i);
    rerender(
      <I18nProvider>
        <ApiStatusBadge status="offline" />
      </I18nProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/API Offline/i);
    rerender(
      <I18nProvider>
        <ApiStatusBadge status="checking" />
      </I18nProvider>,
    );
    expect(screen.getByRole('status')).toHaveTextContent(/Checking API/i);
  });

  it('renders ErrorState alert and invokes onRetry callback', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <I18nProvider>
        <ErrorState message="Catalog unavailable" onRetry={onRetry} />
      </I18nProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Catalog unavailable');
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders Header language switcher and FooterAttribution TVmaze CC BY-SA link', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <MemoryRouter>
          <Header />
          <FooterAttribution />
        </MemoryRouter>
      </I18nProvider>,
    );
    const tvmazeLink = screen.getByRole('link', { name: 'TVmaze' });
    expect(tvmazeLink).toHaveAttribute('href', 'https://www.tvmaze.com');
    await user.click(screen.getByRole('button', { name: 'PT-BR' }));
    expect(screen.getByRole('link', { name: 'Minha Lista' })).toBeInTheDocument();
  });
});
