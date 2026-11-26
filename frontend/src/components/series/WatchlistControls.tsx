import { Trash2 } from 'lucide-react';
import { NeonButton } from '@/components/ds/NeonButton';
import { useI18n } from '@/hooks/useI18n';
import type { SeriesTrackingState, WatchStatus } from '@/types/watchlist';

type WatchlistControlsProps = {
  tracking: SeriesTrackingState;
  onSelectStatus: (status: WatchStatus) => void;
  onRemove: () => void;
};

const STATUS_OPTIONS: readonly { value: WatchStatus; key: 'statusWantToWatch' | 'statusWatching' | 'statusWatched' }[] = [
  { value: 'want_to_watch', key: 'statusWantToWatch' },
  { value: 'watching', key: 'statusWatching' },
  { value: 'watched', key: 'statusWatched' },
];

export function WatchlistControls({ tracking, onSelectStatus, onRemove }: WatchlistControlsProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <label className="sr-only" htmlFor="watch-status-select">{t('watchlistStatusLabel')}</label>
      <select id="watch-status-select" aria-label={t('watchlistStatusLabel')} value={tracking.status ?? ''} onChange={(e) => e.target.value && onSelectStatus(e.target.value as WatchStatus)} className="min-h-[42px] rounded-control border border-ds-accent/50 bg-ds-elevated px-3.5 py-1.5 text-sm font-semibold text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        {!tracking.inWatchlist && <option value="">{t('watchlistAdd')}</option>}
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{t(opt.key)}</option>
        ))}
      </select>
      {tracking.inWatchlist && (
        <NeonButton variant="danger" onClick={onRemove}>
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          <span>{t('watchlistRemove')}</span>
        </NeonButton>
      )}
    </div>
  );
}
