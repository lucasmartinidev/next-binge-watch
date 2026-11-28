import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import * as listService from '@/services/listService';
import * as watchlistService from '@/services/watchlistService';
import { WatchlistView } from './WatchlistView';

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
}));

describe('WatchlistView', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('filters watchlist by status tab, updates status, and removes items', async () => {
    const user = userEvent.setup();
    const item = {
      seriesId: 169,
      name: 'Breaking Bad',
      localizedName: null,
      imageUrl: null,
      status: 'watching' as const,
      genres: ['Drama'],
      rating: 9.2,
      watchedEpisodes: 1,
      totalEpisodes: 2,
      progressPercent: 50,
      nextEpisode: { id: 102, season: 1, number: 2, name: 'Cat', airdate: '2008-01-27' },
      tvmazeUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
      updatedAt: '2026-11-24T00:00:00Z',
    };
    const getSpy = vi
      .spyOn(watchlistService, 'getWatchlist')
      .mockResolvedValueOnce({ total: 1, items: [item] })
      .mockResolvedValueOnce({ total: 0, items: [] });
    vi.spyOn(listService, 'getLists').mockResolvedValue({
      primaryLists: [
        { id: 'p-watch', isSystem: true, systemKey: 'watching', entityType: 'series', name: 'Watching', description: null, icon: 'play', color: 'violet', tags: [], itemCount: 1, updatedAt: '' },
      ],
      customLists: [
        { id: 'c-sci', isSystem: false, systemKey: null, entityType: 'series', name: 'Sci-Fi', description: 'Space', icon: 'rocket', color: 'cyan', tags: ['space'], itemCount: 1, updatedAt: '' },
      ],
      availableTags: ['space'],
    });
    vi.spyOn(watchlistService, 'updateWatchStatus').mockResolvedValue({ ...item, status: 'watched' });
    const removeSpy = vi.spyOn(watchlistService, 'removeFromWatchlist').mockResolvedValue();

    render(
      <I18nProvider>
        <MemoryRouter>
          <WatchlistView />
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByText('Breaking Bad')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /watching/i })).toHaveAttribute('href', '/watchlist/p-watch');
    expect(screen.getByRole('link', { name: /sci-fi/i })).toHaveAttribute('href', '/watchlist/c-sci');
    expect(screen.getAllByRole('link', { name: 'Breaking Bad' })).toHaveLength(2);
    expect(screen.getByText(/S01E02 · Cat/)).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText(/watch status breaking bad/i), 'watched');
    await user.click(screen.getByRole('button', { name: /remove from watchlist breaking bad/i }));
    expect(removeSpy).toHaveBeenCalledWith(169, 'en');

    await user.click(screen.getByRole('tab', { name: 'Watching' }));
    await waitFor(() => expect(getSpy).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'watching' })));
    expect(await screen.findByText('Your watchlist is empty')).toBeInTheDocument();
  });

  it('shows error state on load failure and retries', async () => {
    const user = userEvent.setup();
    vi.spyOn(listService, 'getLists').mockResolvedValue({
      primaryLists: [],
      customLists: [
        { id: 'c-sci', isSystem: false, systemKey: null, entityType: 'series', name: 'Sci-Fi', description: null, icon: 'rocket', color: 'cyan', tags: ['space'], itemCount: 1, updatedAt: '' },
      ],
      availableTags: ['space'],
    });
    vi.spyOn(watchlistService, 'getWatchlist')
      .mockRejectedValueOnce(new Error('Watchlist failed'))
      .mockResolvedValueOnce({ total: 0, items: [] });

    render(
      <I18nProvider>
        <MemoryRouter>
          <WatchlistView />
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByText('Watchlist failed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('Your watchlist is empty')).toBeInTheDocument();
  });
});
