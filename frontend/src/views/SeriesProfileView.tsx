import { useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { CastGrid } from '@/components/series/CastGrid';
import { CrewGrid } from '@/components/series/CrewGrid';
import { SeasonEpisodeList } from '@/components/series/SeasonEpisodeList';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useSeriesProfile } from '@/hooks/useSeriesProfile';
import { resolveGenreTheme } from '@/styles/genreThemes';

export function SeriesProfileView() {
  const { id } = useParams();
  const { t } = useI18n();
  const { profile, loading, error, retry, setWatchStatus, remove, toggleEpisode, toggleSeason } = useSeriesProfile(Number(id));
  usePageGenreTheme(resolveGenreTheme(profile?.genres ?? []));
  if (loading) {
    return <LoadingState />;
  }
  if (error || !profile) {
    return <ErrorState message={error ?? t('genericError')} onRetry={retry} />;
  }
  return (
    <div className="space-y-8">
      {profile.partialData && (
        <p role="status" className="rounded-control border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200 backdrop-blur-md">
          {t('seriesPartialWarning')}
        </p>
      )}
      <SeriesHeader series={profile} onSelectStatus={(s) => void setWatchStatus(s)} onRemove={() => void remove()} />
      <CastGrid cast={profile.cast} />
      <CrewGrid crew={profile.crew} />
      <SeasonEpisodeList seasons={profile.seasons} onToggleEpisode={(epId, w) => void toggleEpisode(epId, w)} onToggleSeason={(sn, w) => void toggleSeason(sn, w)} />
    </div>
  );
}
