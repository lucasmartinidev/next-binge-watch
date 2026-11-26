import { useParams } from 'react-router-dom';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { PersonCreditsList } from '@/components/person/PersonCreditsList';
import { PersonHeader } from '@/components/person/PersonHeader';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { usePersonProfile } from '@/hooks/usePersonProfile';

export function PersonProfileView() {
  const { id } = useParams();
  const { t } = useI18n();
  const { profile, loading, error, retry } = usePersonProfile(Number(id));
  usePageGenreTheme('person');
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
          {t('personPartialWarning')}
        </p>
      )}
      <PersonHeader person={profile} />
      <PersonCreditsList heading={t('personCastCredits')} credits={profile.castCredits} />
      <PersonCreditsList heading={t('personCrewCredits')} credits={profile.crewCredits} />
    </div>
  );
}
