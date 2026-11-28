import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ListMembershipModal, type ListMembershipSavePayload } from '@/components/lists/ListMembershipModal';
import { CastGrid } from '@/components/series/CastGrid';
import { CrewGrid } from '@/components/series/CrewGrid';
import { SeasonEpisodeList } from '@/components/series/SeasonEpisodeList';
import { SeriesHeader } from '@/components/series/SeriesHeader';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useLists } from '@/hooks/useLists';
import { useRequireAuthAction } from '@/hooks/useRequireAuthAction';
import { useSeriesProfile } from '@/hooks/useSeriesProfile';
import { updateSeriesLists } from '@/services/listService';
import { resolveGenreTheme } from '@/styles/genreThemes';

export function SeriesProfileView() {
  const { id } = useParams();
  const { locale, t } = useI18n();
  const { isAuthenticated, requireSignIn } = useRequireAuthAction();
  const { profile, loading, error, retry, setWatchStatus, remove, toggleEpisode, toggleSeason } = useSeriesProfile(Number(id));
  const [manageOpen, setManageOpen] = useState(false);
  const [untrackOpen, setUntrackOpen] = useState(false);
  const { lists } = useLists({ enabled: Boolean(profile) && isAuthenticated });
  usePageGenreTheme(resolveGenreTheme(profile?.genres ?? []));
  if (loading) return <LoadingState />;
  if (error || !profile) return <ErrorState message={error ?? t('genericError')} onRetry={retry} />;
  const handleSaveLists = async (payload: ListMembershipSavePayload) => {
    await updateSeriesLists(profile.id, payload, locale);
    retry();
  };
  return (
    <div className="space-y-8">
      {profile.partialData ? <p role="status" className="rounded-control border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200 backdrop-blur-md">{t('seriesPartialWarning')}</p> : null}
      <SeriesHeader series={profile} onSelectStatus={(s) => requireSignIn(() => void setWatchStatus(s))} onRemove={() => requireSignIn(() => (profile.lists?.some((l) => !l.isSystem) ? setUntrackOpen(true) : void remove()))} onManageLists={() => requireSignIn(() => setManageOpen(true))} />
      <CastGrid cast={profile.cast} />
      <CrewGrid crew={profile.crew} />
      <SeasonEpisodeList seasons={profile.seasons} onToggleEpisode={(epId, w) => requireSignIn(() => void toggleEpisode(epId, w))} onToggleSeason={(sn, w) => requireSignIn(() => void toggleSeason(sn, w))} />
      <ListMembershipModal isOpen={manageOpen} entityType="series" entityTitle={profile.localizedName ?? profile.name} allLists={lists} currentListIds={(profile.lists ?? []).map((l) => l.id)} onClose={() => setManageOpen(false)} onSave={handleSaveLists} />
      <ConfirmDialog isOpen={untrackOpen} title={t('listUntrackConfirmTitle')} description={t('listUntrackConfirmBody')} onCancel={() => setUntrackOpen(false)} onConfirm={() => { setUntrackOpen(false); void remove(); }} />
    </div>
  );
}
