import type { ListColorId, ListIconId } from '@/types/list';

export const LIST_ICON_IDS: readonly ListIconId[] = [
  'bookmark', 'play', 'check-circle', 'star', 'heart', 'flame', 'tv', 'film',
  'sparkles', 'clock', 'trophy', 'users', 'user-check', 'clapperboard', 'compass', 'rocket',
];

export const LIST_COLOR_IDS: readonly ListColorId[] = [
  'cyan', 'violet', 'pink', 'amber', 'emerald', 'orange', 'sky', 'yellow',
];

export type ListColorStyle = {
  pill: string;
  ring: string;
  swatch: string;
  border: string;
};

export const LIST_COLOR_STYLES: Record<ListColorId, ListColorStyle> = {
  cyan: { pill: 'border-cyan-400/50 bg-cyan-500/15 text-cyan-200 hover:border-cyan-300', ring: 'ring-cyan-400', swatch: 'bg-cyan-400', border: 'border-cyan-400/40' },
  violet: { pill: 'border-violet-400/50 bg-violet-500/15 text-violet-200 hover:border-violet-300', ring: 'ring-violet-400', swatch: 'bg-violet-400', border: 'border-violet-400/40' },
  pink: { pill: 'border-pink-400/50 bg-pink-500/15 text-pink-200 hover:border-pink-300', ring: 'ring-pink-400', swatch: 'bg-pink-400', border: 'border-pink-400/40' },
  amber: { pill: 'border-amber-400/50 bg-amber-500/15 text-amber-200 hover:border-amber-300', ring: 'ring-amber-400', swatch: 'bg-amber-400', border: 'border-amber-400/40' },
  emerald: { pill: 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200 hover:border-emerald-300', ring: 'ring-emerald-400', swatch: 'bg-emerald-400', border: 'border-emerald-400/40' },
  orange: { pill: 'border-orange-400/50 bg-orange-500/15 text-orange-200 hover:border-orange-300', ring: 'ring-orange-400', swatch: 'bg-orange-400', border: 'border-orange-400/40' },
  sky: { pill: 'border-sky-400/50 bg-sky-500/15 text-sky-200 hover:border-sky-300', ring: 'ring-sky-400', swatch: 'bg-sky-400', border: 'border-sky-400/40' },
  yellow: { pill: 'border-yellow-400/50 bg-yellow-500/15 text-yellow-200 hover:border-yellow-300', ring: 'ring-yellow-400', swatch: 'bg-yellow-400', border: 'border-yellow-400/40' },
};
