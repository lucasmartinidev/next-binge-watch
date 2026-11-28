import type { ListColorId, ListIconId } from '../types/list';
import type { Locale } from '../types/locale';
import type { WatchStatus } from '../types/watchlist';

export const LIST_ICON_IDS: readonly ListIconId[] = [
  'bookmark',
  'play',
  'check-circle',
  'star',
  'heart',
  'flame',
  'tv',
  'film',
  'sparkles',
  'clock',
  'trophy',
  'users',
  'user-check',
  'clapperboard',
  'compass',
  'rocket',
];

export const LIST_COLOR_IDS: readonly ListColorId[] = [
  'cyan',
  'violet',
  'pink',
  'amber',
  'emerald',
  'orange',
  'sky',
  'yellow',
];

export type PrimaryListDefault = {
  id: WatchStatus;
  icon: ListIconId;
  color: ListColorId;
};

export const PRIMARY_LIST_DEFAULTS: readonly PrimaryListDefault[] = [
  { id: 'want_to_watch', icon: 'bookmark', color: 'cyan' },
  { id: 'watching', icon: 'play', color: 'amber' },
  { id: 'watched', icon: 'check-circle', color: 'emerald' },
];

export const PRIMARY_LIST_KEYS = new Set<string>(['want_to_watch', 'watching', 'watched']);

const PRIMARY_LIST_COPY: Record<Locale, Record<WatchStatus, { name: string; description: string }>> = {
  en: {
    want_to_watch: { name: 'Want to Watch', description: 'Series queued to watch next' },
    watching: { name: 'Watching', description: 'Series currently in progress' },
    watched: { name: 'Watched', description: 'Series you have completed' },
  },
  'pt-BR': {
    want_to_watch: { name: 'Quero Assistir', description: 'Séries na fila para assistir' },
    watching: { name: 'Assistindo', description: 'Séries em andamento' },
    watched: { name: 'Assistida', description: 'Séries já concluídas' },
  },
};

export const RESERVED_PRIMARY_LIST_NAMES = new Set<string>([
  'want to watch',
  'watching',
  'watched',
  'quero assistir',
  'assistindo',
  'assistida',
]);

export function getPrimaryListCopy(status: WatchStatus, locale: Locale): { name: string; description: string } {
  return PRIMARY_LIST_COPY[locale][status];
}
