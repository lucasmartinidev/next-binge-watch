import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import { AppRoutes } from '@/App';
import { AppLayout } from '../layout/AppLayout';
import { EmptyState } from './EmptyState';
import { LoadingState } from './LoadingState';
import { MediaImage } from './MediaImage';
import { StatusBadge } from './StatusBadge';

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: 'pt-BR', updatedAt: '2026-11-24T00:00:00Z' }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: '2026-11-24T00:00:00Z' }),
}));

vi.mock('@/services/healthService', () => ({
  checkApiHealth: vi.fn().mockResolvedValue(true),
}));

describe('Common components and App shell', () => {
  it('renders LoadingState, EmptyState, MediaImage (image & fallback), and StatusBadge', () => {
    render(
      <I18nProvider>
        <LoadingState />
        <EmptyState title="Nothing here" description="Try again" />
        <MediaImage src="https://img.example/a.jpg" alt="Poster" variant="series" />
        <MediaImage src={null} alt="Actor" variant="person" />
        <StatusBadge label="Series" tone="accent" />
        <StatusBadge label="Watching" />
      </I18nProvider>,
    );
    expect(screen.getAllByRole('status')).toHaveLength(2);
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByAltText('Poster')).toHaveAttribute('src', 'https://img.example/a.jpg');
    expect(screen.getByRole('img', { name: 'Actor' })).toBeInTheDocument();
    expect(screen.getByText('Series')).toBeInTheDocument();
  });

  it('renders NotFoundView inside AppLayout on unknown route', async () => {
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={['/does-not-exist']}>
          <AppLayout>
            <AppRoutes />
          </AppLayout>
        </MemoryRouter>
      </I18nProvider>,
    );
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });
});
