import type { WatchlistFilter, WatchlistItem } from '@/types/watchlist';

export function replaceOrDropItem(
  items: WatchlistItem[],
  updated: WatchlistItem,
  filter: WatchlistFilter,
): WatchlistItem[] {
  if (filter !== 'all' && filter !== updated.status) {
    return items.filter((item) => item.seriesId !== updated.seriesId);
  }
  return items.map((item) => (item.seriesId === updated.seriesId ? updated : item));
}

export function dropItem(items: WatchlistItem[], seriesId: number): WatchlistItem[] {
  return items.filter((item) => item.seriesId !== seriesId);
}
