import { ExternalLink } from 'lucide-react';
import { MediaImage } from '@/components/common/MediaImage';
import { HudPanel } from '@/components/ds/HudPanel';
import { ProgressBar } from '@/components/watchlist/ProgressBar';
import { useI18n } from '@/hooks/useI18n';
import type { SeriesProfile } from '@/types/series';
import type { WatchStatus } from '@/types/watchlist';
import { SeriesMetaList } from './SeriesMetaList';
import { WatchlistControls } from './WatchlistControls';

type SeriesHeaderProps = {
  series: SeriesProfile;
  onSelectStatus: (status: WatchStatus) => void;
  onRemove: () => void;
};

export function SeriesHeader({ series, onSelectStatus, onRemove }: SeriesHeaderProps) {
  const { t } = useI18n();
  const displayName = series.localizedName ?? series.name;
  return (
    <HudPanel as="section" className="flex flex-col gap-6 p-6 shadow-neon sm:flex-row">
      <MediaImage src={series.imageUrl} alt={displayName} variant="series" className="h-72 w-48 shrink-0 self-center border-ds-accent/50 sm:self-start" />
      <div className="flex-1 space-y-4">
        <div className="space-y-1">
          <h1 className="font-display text-3xl font-bold tracking-tight text-ds-text sm:text-4xl">{displayName}</h1>
          {series.localizedName && series.localizedName !== series.name && <p className="text-sm text-ds-muted">{t('seriesOriginalTitle')}: {series.name}</p>}
        </div>
        <SeriesMetaList series={series} />
        <p className="text-sm leading-relaxed text-ds-text/90">{series.summary ?? t('seriesNoSummary')}</p>
        <WatchlistControls tracking={series.tracking} onSelectStatus={onSelectStatus} onRemove={onRemove} />
        {series.tracking.totalEpisodes > 0 && <ProgressBar watched={series.tracking.watchedEpisodes} total={series.tracking.totalEpisodes} percent={series.tracking.progressPercent} />}
        <a href={series.tvmazeUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded text-sm font-semibold text-ds-accent underline underline-offset-4 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
          <span>{t('seriesViewOnTvmaze')}</span>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>
      </div>
    </HudPanel>
  );
}
