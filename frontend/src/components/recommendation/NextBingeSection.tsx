import { Sparkles } from 'lucide-react';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useNextBinge } from '@/hooks/useNextBinge';
import { resolveGenreTheme } from '@/styles/genreThemes';
import { NextBingeCard } from './NextBingeCard';

export function NextBingeSection() {
  const { t } = useI18n();
  const { recommendation, hasMore, loading, error, showAnother, addRecommendedToWatchlist, retry } = useNextBinge();
  usePageGenreTheme(resolveGenreTheme(recommendation?.genres ?? []));
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
        <NextBingeCard item={recommendation} hasMore={hasMore} onShowAnother={showAnother} onAdd={() => void addRecommendedToWatchlist()} />
      )}
    </section>
  );
}
