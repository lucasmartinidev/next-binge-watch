import { EmptyState } from '@/components/common/EmptyState';
import { useI18n } from '@/hooks/useI18n';
import type { SearchResultItem } from '@/types/search';
import { SearchResultCard } from './SearchResultCard';

export function SearchResultList({ items }: { items: SearchResultItem[] }) {
  const { t } = useI18n();
  if (items.length === 0) {
    return <EmptyState title={t('searchEmptyTitle')} description={t('searchEmptyBody')} />;
  }
  return (
    <div className="space-y-3">
      <p aria-live="polite" className="font-mono text-xs font-medium text-ds-muted">
        {items.length} {t('searchResultsCount')}
      </p>
      <ul className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <li key={`${item.contentType}-${item.id}`}>
            <SearchResultCard item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}
