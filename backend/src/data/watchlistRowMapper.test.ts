import { describe, expect, it } from 'vitest';
import { mapWatchlistRow, toIsoTimestamp } from './watchlistRowMapper';

describe('watchlistRowMapper (UT-02)', () => {
  it('normalizes PostgreSQL JSONB arrays, Date TIMESTAMPTZ values, and nullable columns', () => {
    const createdAt = new Date('2026-11-26T20:00:00.000Z');
    const updatedAt = new Date('2026-11-26T21:00:00.000Z');
    const mapped = mapWatchlistRow({
      series_id: 169,
      name: 'Breaking Bad',
      localized_name_pt_br: null,
      image_url: null,
      status: 'watching',
      genres: ['Drama', 'Crime'],
      rating: null,
      total_episodes: 62,
      tvmaze_url: 'https://www.tvmaze.com/shows/169/breaking-bad',
      created_at: createdAt,
      updated_at: updatedAt,
    });
    expect(mapped).toEqual({
      seriesId: 169,
      name: 'Breaking Bad',
      localizedNamePtBr: null,
      imageUrl: null,
      status: 'watching',
      genres: ['Drama', 'Crime'],
      rating: null,
      totalEpisodes: 62,
      tvmazeUrl: 'https://www.tvmaze.com/shows/169/breaking-bad',
      createdAt: '2026-11-26T20:00:00.000Z',
      updatedAt: '2026-11-26T21:00:00.000Z',
    });
  });

  it('handles stringified JSON genres, invalid genre payloads, and string timestamps', () => {
    const withJsonString = mapWatchlistRow({
      series_id: 1,
      name: 'Dark',
      localized_name_pt_br: 'Dark',
      image_url: 'https://example.com/dark.jpg',
      status: 'watched',
      genres: '["Sci-Fi","Thriller"]',
      rating: 8.9,
      total_episodes: 26,
      tvmaze_url: 'https://www.tvmaze.com/shows/1/dark',
      created_at: '2026-11-26T18:00:00.000Z',
      updated_at: '2026-11-26T19:00:00.000Z',
    });
    expect(withJsonString.genres).toEqual(['Sci-Fi', 'Thriller']);
    expect(withJsonString.rating).toBe(8.9);
    expect(withJsonString.createdAt).toBe('2026-11-26T18:00:00.000Z');
    const withEmptyGenres = mapWatchlistRow({
      ...withJsonString,
      series_id: 2,
      localized_name_pt_br: null,
      image_url: null,
      genres: null,
      rating: null,
      total_episodes: null,
      tvmaze_url: 'https://www.tvmaze.com/shows/2/other',
      created_at: '2026-11-26T18:00:00.000Z',
      updated_at: '2026-11-26T19:00:00.000Z',
    });
    expect(withEmptyGenres.genres).toEqual([]);
    expect(withEmptyGenres.totalEpisodes).toBe(0);
    expect(toIsoTimestamp('2026-11-26T18:00:00.000Z')).toBe('2026-11-26T18:00:00.000Z');
  });
});
