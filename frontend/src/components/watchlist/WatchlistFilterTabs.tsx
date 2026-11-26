import { useI18n } from '@/hooks/useI18n';
import type { WatchlistFilter } from '@/types/watchlist';

type WatchlistFilterTabsProps = {
  filter: WatchlistFilter;
  onChange: (next: WatchlistFilter) => void;
};

const TABS: readonly { value: WatchlistFilter; key: 'scopeAll' | 'statusWantToWatch' | 'statusWatching' | 'statusWatched' }[] = [
  { value: 'all', key: 'scopeAll' },
  { value: 'want_to_watch', key: 'statusWantToWatch' },
  { value: 'watching', key: 'statusWatching' },
  { value: 'watched', key: 'statusWatched' },
];

export function WatchlistFilterTabs({ filter, onChange }: WatchlistFilterTabsProps) {
  const { t } = useI18n();
  return (
    <div role="tablist" aria-label={t('watchlistStatusLabel')} className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const selected = filter === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.value)}
            className={`min-h-[40px] rounded-full px-4 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent ${
              selected
                ? 'bg-ds-accent text-ds-ink shadow-neon'
                : 'border border-ds-border bg-ds-elevated/80 text-ds-muted hover:border-ds-accent/60 hover:text-ds-text'
            }`}
          >
            {t(tab.key)}
          </button>
        );
      })}
    </div>
  );
}
