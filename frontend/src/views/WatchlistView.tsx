import { useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { MyListsHubSection } from '@/components/lists/MyListsHubSection';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';
import { WatchlistFilterTabs } from '@/components/watchlist/WatchlistFilterTabs';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useWatchlist } from '@/hooks/useWatchlist';
import type { WatchStatus, WatchlistFilter, WatchlistItem } from '@/types/watchlist';

function TrackedSeriesSection(props: { filter: WatchlistFilter; setFilter: (f: WatchlistFilter) => void; items: WatchlistItem[]; loading: boolean; error: string | null; retry: () => void; onChangeStatus: (id: number, s: WatchStatus) => void; onRemove: (item: WatchlistItem) => void }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="tracked-series-heading" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="tracked-series-heading" className="font-display text-lg font-bold text-white">{t('listsTrackedSectionTitle')}</h2>
        <WatchlistFilterTabs filter={props.filter} onChange={props.setFilter} />
      </div>
      {props.loading && <LoadingState />}
      {!props.loading && props.error && <ErrorState message={props.error} onRetry={props.retry} />}
      {!props.loading && !props.error && props.items.length === 0 && <EmptyState title={t('watchlistEmptyTitle')} description={t('watchlistEmptyBody')} />}
      {!props.loading && !props.error && props.items.length > 0 && (
        <ul className="space-y-3.5">{props.items.map((item) => <li key={item.seriesId}><WatchlistCard item={item} onChangeStatus={props.onChangeStatus} onRemove={() => props.onRemove(item)} /></li>)}</ul>
      )}
    </section>
  );
}

export function WatchlistView() {
  const { t } = useI18n();
  const { filter, setFilter, items, loading, error, retry, changeStatus, remove } = useWatchlist();
  const [untrackId, setUntrackId] = useState<number | null>(null);
  usePageGenreTheme('default');
  const handleRemoveRequest = (item: WatchlistItem) => {
    if (item.lists?.some((l) => !l.isSystem)) {
      return setUntrackId(item.seriesId);
    }
    void remove(item.seriesId);
  };
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold tracking-tight text-ds-text">{t('watchlistTitle')}</h1>
      <MyListsHubSection onListsChanged={retry} />
      <TrackedSeriesSection filter={filter} setFilter={setFilter} items={items} loading={loading} error={error} retry={retry} onChangeStatus={(id, s) => void changeStatus(id, s)} onRemove={handleRemoveRequest} />
      <ConfirmDialog isOpen={untrackId !== null} title={t('listUntrackConfirmTitle')} description={t('listUntrackConfirmBody')} onCancel={() => setUntrackId(null)} onConfirm={() => { if (untrackId !== null) { void remove(untrackId); setUntrackId(null); } }} />
    </div>
  );
}
