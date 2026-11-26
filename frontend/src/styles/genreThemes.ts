import type { GenreThemeId } from '@/types/theme';

const GENRE_MATCHERS: readonly { theme: GenreThemeId; keywords: readonly string[] }[] = [
  { theme: 'sci-fi', keywords: ['science-fiction', 'sci-fi', 'space', 'cyber'] },
  { theme: 'crime-thriller', keywords: ['crime', 'thriller', 'mystery', 'espionage'] },
  { theme: 'horror', keywords: ['horror', 'supernatural'] },
  { theme: 'fantasy', keywords: ['fantasy', 'anime', 'animation', 'children'] },
  { theme: 'action', keywords: ['action', 'adventure', 'war', 'western', 'sports'] },
  { theme: 'comedy', keywords: ['comedy', 'family', 'music'] },
  { theme: 'documentary', keywords: ['documentary', 'history', 'nature', 'food', 'travel'] },
  { theme: 'drama', keywords: ['drama', 'romance', 'medical', 'legal'] },
];

export function resolveGenreTheme(
  genres: readonly string[] = [],
  contentType: 'series' | 'person' = 'series',
): GenreThemeId {
  if (contentType === 'person') {
    return 'person';
  }
  const normalized = genres.map((genre) => genre.trim().toLowerCase());
  for (const genre of normalized) {
    const match = GENRE_MATCHERS.find((entry) =>
      entry.keywords.some((keyword) => genre.includes(keyword)),
    );
    if (match) {
      return match.theme;
    }
  }
  return 'default';
}
