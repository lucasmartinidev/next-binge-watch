import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';
import { WatchlistFilterTabs } from '@/components/watchlist/WatchlistFilterTabs';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useWatchlist } from '@/hooks/useWatchlist';

export function WatchlistView() {
  const { t } = useI18n();
  const { filter, setFilter, items, loading, error, retry, changeStatus, remove } = useWatchlist();
  usePageGenreTheme('default');
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="font-display text-3xl font-bold tracking-tight text-ds-text">{t('watchlistTitle')}</h1>
        <WatchlistFilterTabs filter={filter} onChange={setFilter} />
      </div>
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && items.length === 0 && (
        <EmptyState title={t('watchlistEmptyTitle')} description={t('watchlistEmptyBody')} />
      )}
      {!loading && !error && items.length > 0 && (
        <ul className="space-y-3.5">
          {items.map((item) => (
            <li key={item.seriesId}>
              <WatchlistCard item={item} onChangeStatus={(id, s) => void changeStatus(id, s)} onRemove={(id) => void remove(id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
