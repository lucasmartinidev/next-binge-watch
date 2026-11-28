import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import * as seriesService from '@/services/seriesService';
import * as watchlistService from '@/services/watchlistService';
import { SeriesProfileView } from './SeriesProfileView';

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: 'pt-BR', updatedAt: null }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'pt-BR', updatedAt: null }),
}));

describe('SeriesProfileView (UT-12)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const sampleProfile = {
    id: 169,
    name: 'Breaking Bad',
    localizedName: 'Breaking Bad: A Química do Mal',
    showType: 'Scripted',
    status: 'Ended',
    premiered: '2008-01-20',
    ended: '2013-09-29',
    genres: ['Drama', 'Crime'],
    rating: 9.2,
    networkName: 'AMC',
    imageUrl: null,
    summary: 'Chemistry teacher turns cook.',
    tvmazeUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
    cast: [{ personId: 14229, name: 'Bryan Cranston', imageUrl: null, characterName: 'Walter White' }],
    crew: [{ personId: 31870, name: 'Vince Gilligan', imageUrl: null, role: 'Creator' }],
    seasons: [
      {
        seasonNumber: 1,
        watchedCount: 0,
        totalCount: 2,
        allWatched: false,
        episodes: [
          { id: 101, season: 1, number: 1, name: 'Pilot', airdate: '2008-01-20', summary: 'First', watched: false },
          { id: 102, season: 1, number: 2, name: 'Cat', airdate: '2008-01-27', summary: null, watched: false },
        ],
      },
    ],
    tracking: {
      inWatchlist: false,
      status: null,
      watchedEpisodes: 0,
      totalEpisodes: 2,
      progressPercent: 0,
      nextEpisode: { id: 101, season: 1, number: 1, name: 'Pilot', airdate: '2008-01-20' },
    },
    lists: [{ id: 'p-watching', name: 'Watching', icon: 'play' as const, color: 'violet' as const, isSystem: true, systemKey: 'watching' as const }],
    partialData: true,
  };

  it('renders localized AKA, cast/crew links, TVmaze link, and toggles episodes/seasons', async () => {
    const user = userEvent.setup();
    vi.spyOn(seriesService, 'getSeriesProfile').mockResolvedValue(sampleProfile);
    vi.spyOn(watchlistService, 'addToWatchlist').mockResolvedValue({
      seriesId: 169,
      name: 'Breaking Bad',
      localizedName: 'Breaking Bad: A Química do Mal',
      imageUrl: null,
      status: 'want_to_watch',
      genres: ['Drama'],
      rating: 9.2,
      watchedEpisodes: 0,
      totalEpisodes: 2,
      progressPercent: 0,
      nextEpisode: null,
      tvmazeUrl: sampleProfile.tvmazeUrl,
      updatedAt: '2026-11-24T00:00:00Z',
    });
    vi.spyOn(watchlistService, 'toggleEpisodeWatched').mockResolvedValue({
      inWatchlist: true,
      status: 'watching',
      watchedEpisodes: 1,
      totalEpisodes: 2,
      progressPercent: 50,
      nextEpisode: { id: 102, season: 1, number: 2, name: 'Cat', airdate: '2008-01-27' },
    });
    vi.spyOn(watchlistService, 'toggleSeasonWatched').mockResolvedValue({
      inWatchlist: true,
      status: 'watched',
      watchedEpisodes: 2,
      totalEpisodes: 2,
      progressPercent: 100,
      nextEpisode: null,
    });
    const removeSpy = vi.spyOn(watchlistService, 'removeFromWatchlist').mockResolvedValue();

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={['/series/169']}>
          <Routes>
            <Route path="/series/:id" element={<SeriesProfileView />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Breaking Bad: A Química do Mal' })).toBeInTheDocument();
    expect(screen.getByText(/Breaking Bad$/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /bryan cranston/i })).toHaveAttribute('href', '/people/14229');
    expect(screen.getByRole('link', { name: /vince gilligan/i })).toHaveAttribute('href', '/people/31870');
    expect(screen.getByRole('link', { name: /tvmaze/i })).toHaveAttribute('href', sampleProfile.tvmazeUrl);
    expect(screen.getByRole('link', { name: 'Watching' })).toHaveAttribute('href', '/watchlist/p-watching');
    expect(screen.getByRole('button', { name: /gerenciar listas/i })).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText('Status'), 'want_to_watch');
    await user.click(screen.getByRole('checkbox', { name: /S01E01/i }));
    expect(await screen.findByText('50%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /marcar temporada/i }));
    expect(await screen.findByText('100%')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /remover da lista/i }));
    expect(removeSpy).toHaveBeenCalledWith(169, 'pt-BR');
  });

  it('refreshes badges on episode toggle and prompts confirmation when untracking series in custom lists (BUG-03, BUG-04)', async () => {
    const user = userEvent.setup();
    const withCustom = {
      ...sampleProfile,
      tracking: { ...sampleProfile.tracking, inWatchlist: true, status: 'want_to_watch' as const },
      lists: [
        { id: 'want_to_watch', name: 'Quero Assistir', icon: 'bookmark' as const, color: 'cyan' as const, isSystem: true, systemKey: 'want_to_watch' as const },
        { id: 'c1', name: 'Sci-Fi', icon: 'rocket' as const, color: 'violet' as const, isSystem: false, systemKey: null },
      ],
    };
    const afterToggle = {
      ...withCustom,
      tracking: { ...withCustom.tracking, status: 'watching' as const, watchedEpisodes: 1, progressPercent: 50 },
      lists: [
        { id: 'watching', name: 'Assistindo', icon: 'play' as const, color: 'amber' as const, isSystem: true, systemKey: 'watching' as const },
        { id: 'c1', name: 'Sci-Fi', icon: 'rocket' as const, color: 'violet' as const, isSystem: false, systemKey: null },
      ],
    };
    vi.spyOn(seriesService, 'getSeriesProfile').mockResolvedValueOnce(withCustom).mockResolvedValueOnce(afterToggle);
    vi.spyOn(watchlistService, 'toggleEpisodeWatched').mockResolvedValue(afterToggle.tracking);
    const removeSpy = vi.spyOn(watchlistService, 'removeFromWatchlist').mockResolvedValue();
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={['/series/169']}>
          <Routes><Route path="/series/:id" element={<SeriesProfileView />} /></Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
    expect(await screen.findByRole('link', { name: 'Quero Assistir' })).toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: /S01E01/i }));
    expect(await screen.findByRole('link', { name: 'Assistindo' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /remover da lista/i }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    expect(removeSpy).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(removeSpy).toHaveBeenCalledWith(169, 'pt-BR');
  });
});
