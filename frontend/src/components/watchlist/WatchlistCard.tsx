import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaImage } from '@/components/common/MediaImage';
import { HudPanel } from '@/components/ds/HudPanel';
import { NeonButton } from '@/components/ds/NeonButton';
import { ListMembershipBadges } from '@/components/lists/ListMembershipBadges';
import { useI18n } from '@/hooks/useI18n';
import { resolveGenreTheme } from '@/styles/genreThemes';
import type { WatchStatus, WatchlistItem } from '@/types/watchlist';
import { ProgressBar } from './ProgressBar';

type WatchlistCardProps = {
  item: WatchlistItem;
  onChangeStatus: (seriesId: number, status: WatchStatus) => void;
  onRemove: (seriesId: number) => void;
};

function WatchlistCardActions({ item, displayName, onChangeStatus, onRemove }: WatchlistCardProps & { displayName: string }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label={`${t('watchlistStatusLabel')} ${displayName}`} value={item.status} onChange={(e) => onChangeStatus(item.seriesId, e.target.value as WatchStatus)} className="min-h-[38px] rounded-control border border-ds-border bg-ds-elevated px-3 py-1 text-xs font-semibold text-ds-text focus-visible:border-ds-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        <option value="want_to_watch">{t('statusWantToWatch')}</option>
        <option value="watching">{t('statusWatching')}</option>
        <option value="watched">{t('statusWatched')}</option>
      </select>
      <NeonButton variant="danger" onClick={() => onRemove(item.seriesId)} ariaLabel={`${t('watchlistRemove')} ${displayName}`} className="min-h-[38px] px-3 py-1 text-xs">
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('watchlistRemove')}</span>
      </NeonButton>
    </div>
  );
}

export function WatchlistCard({ item, onChangeStatus, onRemove }: WatchlistCardProps) {
  const { t } = useI18n();
  const displayName = item.localizedName ?? item.name;
  return (
    <HudPanel as="article" genreTheme={resolveGenreTheme(item.genres)} className="flex flex-col gap-4 p-4 sm:flex-row">
      <Link to={`/series/${item.seriesId}`} aria-label={displayName} className="shrink-0 self-center rounded sm:self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        <MediaImage src={item.imageUrl} alt={displayName} variant="series" className="h-32 w-24 border-ds-accent/40" />
      </Link>
      <div className="flex flex-1 flex-col justify-between gap-3">
        <div className="space-y-1">
          <Link to={`/series/${item.seriesId}`} className="rounded font-display text-lg font-bold text-ds-text hover:text-ds-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
            {displayName}
          </Link>
          {item.nextEpisode && (
            <p className="font-mono text-xs text-ds-muted">
              {t('seriesNextEpisode')}: S{String(item.nextEpisode.season).padStart(2, '0')}E{String(item.nextEpisode.number).padStart(2, '0')} · {item.nextEpisode.name}
            </p>
          )}
        </div>
        <ProgressBar watched={item.watchedEpisodes} total={item.totalEpisodes} percent={item.progressPercent} />
        <ListMembershipBadges lists={item.lists} />
        <WatchlistCardActions item={item} displayName={displayName} onChangeStatus={onChangeStatus} onRemove={onRemove} />
      </div>
    </HudPanel>
  );
}
