import { useI18n } from '@/hooks/useI18n';
import type { ListEntityType } from '@/types/list';

export type ListHubFiltersProps = {
  typeFilter: ListEntityType | 'all';
  tagFilter: string;
  availableTags: string[];
  onTypeChange: (type: ListEntityType | 'all') => void;
  onTagChange: (tag: string) => void;
};

export function ListHubFilters({ typeFilter, tagFilter, availableTags, onTypeChange, onTagChange }: ListHubFiltersProps) {
  const { t } = useI18n();
  const options: Array<{ value: ListEntityType | 'all'; label: string }> = [
    { value: 'all', label: t('listsFilterAll') },
    { value: 'series', label: t('listBadgeSeriesType') },
    { value: 'person', label: t('listBadgePersonType') },
  ];
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="flex items-center gap-1.5" role="group" aria-label={t('listFormTypeLabel')}>
        {options.map((option) => (
          <button key={option.value} type="button" aria-pressed={typeFilter === option.value} onClick={() => onTypeChange(option.value)} className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${typeFilter === option.value ? 'border-[var(--ds-accent)] bg-[var(--ds-accent)]/20 text-white' : 'border-white/15 bg-white/5 text-[var(--ds-muted)] hover:bg-white/10'}`}>
            {option.label}
          </button>
        ))}
      </div>
      {availableTags.length > 0 ? (
        <select aria-label={t('listFormTagsLabel')} value={tagFilter} onChange={(e) => onTagChange(e.target.value)} className="rounded-lg border border-white/15 bg-slate-950/70 px-3 py-1.5 text-xs font-medium text-white">
          <option value="">{t('listsTagFilterAll')}</option>
          {availableTags.map((tag) => <option key={tag} value={tag}>#{tag}</option>)}
        </select>
      ) : null}
    </div>
  );
}
