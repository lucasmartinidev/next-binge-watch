import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ListMembershipModal, type ListMembershipSavePayload } from '@/components/lists/ListMembershipModal';
import { PersonCreditsList } from '@/components/person/PersonCreditsList';
import { PersonHeader } from '@/components/person/PersonHeader';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useLists } from '@/hooks/useLists';
import { usePersonProfile } from '@/hooks/usePersonProfile';
import { useRequireAuthAction } from '@/hooks/useRequireAuthAction';
import { updatePersonLists } from '@/services/listService';

export function PersonProfileView() {
  const { id } = useParams();
  const { locale, t } = useI18n();
  const { isAuthenticated, requireSignIn } = useRequireAuthAction();
  const { profile, loading, error, retry } = usePersonProfile(Number(id));
  const [manageOpen, setManageOpen] = useState(false);
  const { lists } = useLists({ type: 'person', enabled: Boolean(profile) && isAuthenticated });
  usePageGenreTheme('person');
  if (loading) return <LoadingState />;
  if (error || !profile) return <ErrorState message={error ?? t('genericError')} onRetry={retry} />;
  const handleSaveLists = async (payload: ListMembershipSavePayload) => {
    await updatePersonLists(profile.id, { customListIds: payload.customListIds }, locale);
    retry();
  };
  return (
    <div className="space-y-8">
      {profile.partialData ? <p role="status" className="rounded-control border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-200 backdrop-blur-md">{t('personPartialWarning')}</p> : null}
      <PersonHeader person={profile} onManageLists={() => requireSignIn(() => setManageOpen(true))} />
      <PersonCreditsList heading={t('personCastCredits')} credits={profile.castCredits} />
      <PersonCreditsList heading={t('personCrewCredits')} credits={profile.crewCredits} />
      <ListMembershipModal isOpen={manageOpen} entityType="person" entityTitle={profile.name} allLists={lists} currentListIds={(profile.lists ?? []).map((l) => l.id)} onClose={() => setManageOpen(false)} onSave={handleSaveLists} />
    </div>
  );
}
