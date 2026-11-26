import { NeonButton } from '@/components/ds/NeonButton';
import { useI18n } from '@/hooks/useI18n';
import type { SeasonGroup } from '@/types/series';
import { EpisodeRow } from './EpisodeRow';

type SeasonEpisodeListProps = {
  seasons: SeasonGroup[];
  onToggleEpisode: (episodeId: number, watched: boolean) => void;
  onToggleSeason: (seasonNumber: number, watched: boolean) => void;
};

export function SeasonEpisodeList({ seasons, onToggleEpisode, onToggleSeason }: SeasonEpisodeListProps) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="seasons-heading" className="space-y-3">
      <h2 id="seasons-heading" className="font-display text-xl font-bold text-ds-text">{t('seriesSeasonsHeading')}</h2>
      {seasons.length === 0 && <p className="text-sm text-ds-muted">{t('seriesNoEpisodes')}</p>}
      {seasons.map((season) => (
        <details key={season.seasonNumber} open={season.seasonNumber === 1} className="ds-hud-panel rounded-hud p-4 backdrop-blur-md">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-semibold text-ds-text">
            <span className="font-display">
              {t('seriesSeasonLabel')} {season.seasonNumber}{' '}
              <span className="font-mono text-xs text-ds-accent">({season.watchedCount}/{season.totalCount})</span>
            </span>
            <NeonButton variant="secondary" onClick={(e) => { e.preventDefault(); onToggleSeason(season.seasonNumber, !season.allWatched); }} className="min-h-[34px] px-3 py-1 text-xs">
              {season.allWatched ? t('seriesUnmarkSeason') : t('seriesMarkSeason')}
            </NeonButton>
          </summary>
          <ul className="mt-3.5 space-y-2">
            {season.episodes.map((ep) => <EpisodeRow key={ep.id} episode={ep} onToggle={onToggleEpisode} />)}
          </ul>
        </details>
      ))}
    </section>
  );
}
