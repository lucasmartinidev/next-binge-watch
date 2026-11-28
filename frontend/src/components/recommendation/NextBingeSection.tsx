import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ListMembershipModal, type ListMembershipSavePayload } from '@/components/lists/ListMembershipModal';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useLists } from '@/hooks/useLists';
import { useNextBinge } from '@/hooks/useNextBinge';
import { useRequireAuthAction } from '@/hooks/useRequireAuthAction';
import { updateSeriesLists } from '@/services/listService';
import { resolveGenreTheme } from '@/styles/genreThemes';
import { NextBingeCard } from './NextBingeCard';

export function NextBingeSection() {
  const { locale, t } = useI18n();
  const { isAuthenticated, requireSignIn } = useRequireAuthAction();
  const { recommendation, hasMore, loading, error, showAnother, addRecommendedToWatchlist, retry } = useNextBinge();
  const [manageOpen, setManageOpen] = useState(false);
  const { lists } = useLists({ enabled: Boolean(recommendation) && isAuthenticated });
  usePageGenreTheme(resolveGenreTheme(recommendation?.genres ?? []));
  const handleSaveLists = async (payload: ListMembershipSavePayload) => {
    if (!recommendation) return;
    await updateSeriesLists(recommendation.seriesId, payload, locale);
    retry();
  };
  return (
    <section aria-labelledby="next-binge-heading" className="space-y-3.5">
      <h2 id="next-binge-heading" className="inline-flex items-center gap-2 font-display text-xl font-bold text-ds-text">
        <Sparkles className="h-5 w-5 text-ds-accent" aria-hidden="true" />
        <span>{t('nextBingeHeading')}</span>
      </h2>
      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={retry} />}
      {!loading && !error && !recommendation && <EmptyState title={t('nextBingeHeading')} description={t('nextBingeEmpty')} />}
      {!loading && !error && recommendation && (
        <>
          <NextBingeCard item={recommendation} hasMore={hasMore} onShowAnother={showAnother} onAdd={() => requireSignIn(() => void addRecommendedToWatchlist())} onManageLists={() => requireSignIn(() => setManageOpen(true))} />
          <ListMembershipModal isOpen={manageOpen} entityType="series" entityTitle={recommendation.localizedName ?? recommendation.name} allLists={lists} currentListIds={(recommendation.lists ?? []).map((l) => l.id)} onClose={() => setManageOpen(false)} onSave={handleSaveLists} />
        </>
      )}
    </section>
  );
}
