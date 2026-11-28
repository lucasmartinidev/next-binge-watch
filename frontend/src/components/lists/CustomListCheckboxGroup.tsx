import { useI18n } from '@/hooks/useI18n';
import type { UserListSummary } from '@/types/list';
import { ListIcon } from './ListIcon';

export type CustomListCheckboxGroupProps = {
  heading: string;
  lists: UserListSummary[];
  selectedIds: string[];
  onToggle: (listId: string) => void;
};

export function CustomListCheckboxGroup({ heading, lists, selectedIds, onToggle }: CustomListCheckboxGroupProps) {
  const { t } = useI18n();
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
        {heading}
      </legend>
      {lists.length === 0 ? (
        <p className="text-xs text-[var(--ds-muted)]">{t('membershipNoCustomLists')}</p>
      ) : (
        <div className="space-y-1.5">
          {lists.map((list) => (
            <label key={list.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
              <input
                type="checkbox"
                checked={selectedIds.includes(list.id)}
                onChange={() => onToggle(list.id)}
                className="accent-[var(--ds-accent)]"
              />
              <ListIcon icon={list.icon} className="h-4 w-4 text-[var(--ds-accent)]" />
              <span>{list.name}</span>
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}
