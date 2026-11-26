import { Search, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { NeonButton } from '@/components/ds/NeonButton';
import { useI18n } from '@/hooks/useI18n';

type SearchFormProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
};

export function SearchForm({ query, onQueryChange, onSubmit, onClear }: SearchFormProps) {
  const { t } = useI18n();
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };
  return (
    <form onSubmit={handleSubmit} role="search" className="flex flex-col gap-2.5 sm:flex-row">
      <div className="relative flex-1">
        <input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="min-h-[46px] w-full rounded-control border border-ds-border bg-ds-elevated/90 px-4 pr-10 text-sm text-ds-text placeholder:text-ds-muted backdrop-blur-md transition focus-visible:border-ds-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent"
        />
        {query && (
          <button type="button" onClick={onClear} aria-label={t('searchClear')} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-ds-muted hover:text-ds-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
      <NeonButton type="submit" className="min-h-[46px] px-6">
        <Search className="h-4 w-4" aria-hidden="true" />
        <span>{t('searchSubmit')}</span>
      </NeonButton>
    </form>
  );
}
