import { afterEach, describe, expect, it, vi } from 'vitest';
import { getPersonProfile } from './personService';
import { getPreferences, updatePreferences } from './preferencesService';
import { getNextBinge } from './recommendationService';
import { searchCatalog } from './searchService';
import { getSeriesProfile } from './seriesService';
import {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
  toggleEpisodeWatched,
  toggleSeasonWatched,
  updateWatchStatus,
} from './watchlistService';

describe('Frontend resource services', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockJsonFetch(body: unknown = {}, status = 200) {
    return vi.spyOn(globalThis, 'fetch').mockImplementation(() =>
      Promise.resolve(new Response(status === 204 ? null : JSON.stringify(body), { status })),
    );
  }

  it('calls search, recommendation, and preferences endpoints with locale', async () => {
    const fetchSpy = mockJsonFetch({});
    await searchCatalog({ query: 'break', type: 'series', locale: 'pt-BR' });
    await getNextBinge({ locale: 'en', excludeIds: [10, 20] });
    await getNextBinge({ locale: 'en', excludeIds: [] });
    await getPreferences();
    await updatePreferences('pt-BR');
    await getSeriesProfile({ id: 169, locale: 'pt-BR' });
    await getPersonProfile({ id: 14229, locale: 'en' });
    expect(fetchSpy).toHaveBeenNthCalledWith(1, '/api/search?q=break&type=series&lang=pt-BR', expect.anything());
    expect(fetchSpy).toHaveBeenNthCalledWith(2, '/api/recommendations/next-binge?excludeIds=10,20&lang=en', expect.anything());
    expect(fetchSpy).toHaveBeenNthCalledWith(3, '/api/recommendations/next-binge?lang=en', expect.anything());
    expect(fetchSpy).toHaveBeenNthCalledWith(4, '/api/preferences', expect.anything());
    expect(fetchSpy).toHaveBeenNthCalledWith(5, '/api/preferences?lang=pt-BR', expect.objectContaining({ method: 'PUT' }));
    expect(fetchSpy).toHaveBeenNthCalledWith(6, '/api/series/169?lang=pt-BR', expect.anything());
    expect(fetchSpy).toHaveBeenNthCalledWith(7, '/api/people/14229?lang=en', expect.anything());
  });

  it('calls watchlist and episode/season endpoints with expected HTTP methods', async () => {
    const fetchSpy = mockJsonFetch({});
    await getWatchlist({ status: 'all', locale: 'en' });
    await getWatchlist({ status: 'watching', locale: 'pt-BR' });
    await addToWatchlist({ seriesId: 169, status: 'want_to_watch', locale: 'en' });
    await updateWatchStatus({ seriesId: 169, status: 'watched', locale: 'en' });
    await toggleEpisodeWatched({ seriesId: 169, episodeId: 101, watched: true, locale: 'en' });
    await toggleSeasonWatched({ seriesId: 169, seasonNumber: 1, watched: true, locale: 'en' });
    mockJsonFetch(null, 204);
    await removeFromWatchlist(169, 'en');
    expect(fetchSpy).toHaveBeenNthCalledWith(1, '/api/watchlist?lang=en', expect.anything());
    expect(fetchSpy).toHaveBeenNthCalledWith(2, '/api/watchlist?status=watching&lang=pt-BR', expect.anything());
    expect(fetchSpy).toHaveBeenNthCalledWith(3, '/api/watchlist?lang=en', expect.objectContaining({ method: 'POST' }));
    expect(fetchSpy).toHaveBeenNthCalledWith(4, '/api/watchlist/169?lang=en', expect.objectContaining({ method: 'PATCH' }));
    expect(fetchSpy).toHaveBeenNthCalledWith(5, '/api/watchlist/169/episodes/101?lang=en', expect.objectContaining({ method: 'PUT' }));
    expect(fetchSpy).toHaveBeenNthCalledWith(6, '/api/watchlist/169/seasons/1?lang=en', expect.objectContaining({ method: 'PUT' }));
  });
});
