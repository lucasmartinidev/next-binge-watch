import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthContext } from '@/hooks/authContextValue';
import { I18nProvider } from '@/i18n/I18nContext';
import { HomeView } from './HomeView';
import * as recommendationService from '@/services/recommendationService';
import * as searchService from '@/services/searchService';
import * as watchlistService from '@/services/watchlistService';

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
}));

describe('HomeView, Search, and Next Binge Watch (UT-11)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('validates empty search, searches results, filters scope, and renders Next Binge spotlight', async () => {
    const user = userEvent.setup();
    vi.spyOn(recommendationService, 'getNextBinge')
      .mockResolvedValueOnce({
        locale: 'en',
        hasMore: true,
        recommendation: {
          seriesId: 169,
          name: 'Breaking Bad',
          localizedName: null,
          imageUrl: null,
          rating: 9.2,
          genres: ['Drama'],
          summary: 'Chemistry teacher.',
          sourceTier: 'top_rated',
          reason: 'Top-rated series to start watching',
          inWatchlist: false,
          nextEpisode: null,
          tvmazeUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
        },
      })
      .mockResolvedValueOnce({
        locale: 'en',
        hasMore: false,
        recommendation: {
          seriesId: 82,
          name: 'Game of Thrones',
          localizedName: null,
          imageUrl: null,
          rating: 8.9,
          genres: ['Fantasy'],
          summary: 'Seven kingdoms.',
          sourceTier: 'top_rated',
          reason: 'Top-rated series to start watching',
          inWatchlist: false,
          nextEpisode: null,
          tvmazeUrl: 'https://www.tvmaze.com/shows/82/game-of-thrones',
          lists: [{ id: 'c-fav', name: 'Favorites', icon: 'star', color: 'amber', isSystem: false, systemKey: null }],
        },
      });
    const addSpy = vi.spyOn(watchlistService, 'addToWatchlist').mockResolvedValue({
      seriesId: 169,
      name: 'Breaking Bad',
      localizedName: null,
      imageUrl: null,
      status: 'want_to_watch',
      genres: ['Drama'],
      rating: 9.2,
      watchedEpisodes: 0,
      totalEpisodes: 62,
      progressPercent: 0,
      nextEpisode: null,
      tvmazeUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
      updatedAt: '2026-11-24T00:00:00Z',
    });
    const searchSpy = vi
      .spyOn(searchService, 'searchCatalog')
      .mockResolvedValueOnce({
        query: 'break',
        type: 'all',
        locale: 'en',
        total: 2,
        items: [
          {
            id: 169,
            contentType: 'series',
            name: 'Breaking Bad',
            localizedName: null,
            imageUrl: null,
            subtitle: 'Scripted · 2008',
            status: 'Ended',
            rating: 9.2,
            premieredYear: '2008',
            genres: ['Drama'],
            tvmazeUrl: 'https://www.tvmaze.com/shows/169',
          },
          {
            id: 14229,
            contentType: 'person',
            name: 'Bryan Cranston',
            localizedName: null,
            imageUrl: null,
            subtitle: 'United States',
            status: null,
            rating: null,
            premieredYear: null,
            genres: [],
            tvmazeUrl: 'https://www.tvmaze.com/people/14229',
          },
        ],
      })
      .mockResolvedValueOnce({
        query: 'break',
        type: 'person',
        locale: 'en',
        total: 0,
        items: [],
      });

    render(
      <AuthContext.Provider value={{ user: { id: 'u1', username: 'viewer', email: 'v@e.com', role: 'USER', isActive: true, createdAt: '' }, loading: false, isAuthenticated: true, login: vi.fn(), loginAsDev: vi.fn(), logout: vi.fn(), refreshSession: vi.fn() }}>
        <I18nProvider>
          <MemoryRouter>
            <HomeView />
          </MemoryRouter>
        </I18nProvider>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText('Top-rated series to start watching')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /add to watchlist/i }));
    expect(addSpy).toHaveBeenCalledWith({ seriesId: 169, status: 'want_to_watch', locale: 'en' });

    await user.click(screen.getByRole('button', { name: /show another/i }));
    expect(await screen.findByText('Game of Thrones')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Favorites' })).toHaveAttribute('href', '/watchlist/c-fav');

    await user.click(screen.getByRole('button', { name: /^search$/i }));
    expect(screen.getByRole('alert')).toHaveTextContent(/enter at least 1 character/i);

    await user.type(screen.getByRole('searchbox'), 'break');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    expect(await screen.findByText('Bryan Cranston')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bryan cranston/i })).toHaveAttribute('href', '/people/14229');

    await user.click(screen.getByRole('button', { name: 'People' }));
    await waitFor(() => expect(searchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: 'person' })));
    expect(await screen.findByText('No results found')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryByText('No results found')).not.toBeInTheDocument();
  });

  it('displays error states and retries search and recommendation requests', async () => {
    const user = userEvent.setup();
    vi.spyOn(recommendationService, 'getNextBinge')
      .mockRejectedValueOnce(new Error('Upstream busy'))
      .mockResolvedValueOnce({ locale: 'en', hasMore: false, recommendation: null });
    vi.spyOn(searchService, 'searchCatalog')
      .mockRejectedValueOnce(new Error('Search failed'))
      .mockResolvedValueOnce({ query: 'lost', type: 'all', locale: 'en', total: 0, items: [] });

    render(
      <AuthContext.Provider value={{ user: { id: 'u1', username: 'viewer', email: 'v@e.com', role: 'USER', isActive: true, createdAt: '' }, loading: false, isAuthenticated: true, login: vi.fn(), loginAsDev: vi.fn(), logout: vi.fn(), refreshSession: vi.fn() }}>
        <I18nProvider>
          <MemoryRouter>
            <HomeView />
          </MemoryRouter>
        </I18nProvider>
      </AuthContext.Provider>,
    );

    expect(await screen.findByText('Upstream busy')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText(/no recommendations available/i)).toBeInTheDocument();

    await user.type(screen.getByRole('searchbox'), 'lost');
    await user.click(screen.getByRole('button', { name: /^search$/i }));
    expect(await screen.findByText('Search failed')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByText('No results found')).toBeInTheDocument();
  });
});
