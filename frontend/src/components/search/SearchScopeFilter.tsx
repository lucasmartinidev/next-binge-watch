import { useI18n } from '@/hooks/useI18n';
import type { SearchScope } from '@/types/search';

type SearchScopeFilterProps = {
  scope: SearchScope;
  onChange: (nextScope: SearchScope) => void;
};

const SCOPES: readonly { value: SearchScope; key: 'scopeAll' | 'scopeSeries' | 'scopePerson' }[] = [
  { value: 'all', key: 'scopeAll' },
  { value: 'series', key: 'scopeSeries' },
  { value: 'person', key: 'scopePerson' },
];

export function SearchScopeFilter({ scope, onChange }: SearchScopeFilterProps) {
  const { t } = useI18n();
  return (
    <div role="group" aria-label={t('scopeAll')} className="flex flex-wrap gap-2">
      {SCOPES.map((item) => {
        const active = scope === item.value;
        return (
          <button
            key={item.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(item.value)}
            className={`min-h-[38px] rounded-full px-4 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent ${
              active
                ? 'bg-ds-accent text-ds-ink shadow-neon'
                : 'border border-ds-border bg-ds-elevated/80 text-ds-muted hover:border-ds-accent/60 hover:text-ds-text'
            }`}
          >
            {t(item.key)}
          </button>
        );
      })}
    </div>
  );
}
