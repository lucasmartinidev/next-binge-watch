import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { NextBingeSection } from '@/components/recommendation/NextBingeSection';
import { SearchForm } from '@/components/search/SearchForm';
import { SearchResultList } from '@/components/search/SearchResultList';
import { SearchScopeFilter } from '@/components/search/SearchScopeFilter';
import { useI18n } from '@/hooks/useI18n';
import { useSearch } from '@/hooks/useSearch';

export function HomeView() {
  const { t } = useI18n();
  const search = useSearch();
  return (
    <div className="space-y-10">
      <section aria-labelledby="search-heading" className="space-y-4">
        <h1 id="search-heading" className="font-display text-3xl font-bold tracking-tight text-ds-text sm:text-4xl">
          {t('searchTitle')}
        </h1>
        <SearchForm query={search.query} onQueryChange={search.setQuery} onSubmit={search.submit} onClear={search.clear} />
        <SearchScopeFilter scope={search.scope} onChange={search.setScope} />
        {search.loading && <LoadingState />}
        {!search.loading && search.error && <ErrorState message={search.error} onRetry={search.submittedQuery ? search.retry : undefined} />}
        {!search.loading && !search.error && search.data && <SearchResultList items={search.data.items} />}
      </section>
      <NextBingeSection />
    </div>
  );
}
