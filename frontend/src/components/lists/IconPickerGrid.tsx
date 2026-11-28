import { useI18n } from '@/hooks/useI18n';
import type { TranslationKey } from '@/i18n/en';
import { LIST_ICON_IDS } from '@/styles/listPalette';
import type { ListIconId } from '@/types/list';
import { ListIcon } from './ListIcon';

export type IconPickerGridProps = {
  value: ListIconId;
  onChange: (icon: ListIconId) => void;
  label: string;
};

type IconOptionProps = {
  iconId: ListIconId;
  selected: boolean;
  onSelect: (icon: ListIconId) => void;
};

function IconOptionButton({ iconId, selected, onSelect }: IconOptionProps) {
  const { t } = useI18n();
  const iconLabel = t(`listIcon_${iconId}` as TranslationKey);
  const toneClass = selected
    ? 'border-[var(--ds-accent)] bg-[var(--ds-accent)]/20 text-white ring-2 ring-[var(--ds-accent)]/50'
    : 'border-white/15 bg-white/5 text-[var(--ds-muted)] hover:bg-white/10 hover:text-white';
  return (
    <button type="button" aria-label={iconLabel} aria-pressed={selected} onClick={() => onSelect(iconId)} className={`flex h-9 w-9 items-center justify-center rounded-lg border transition ${toneClass}`}>
      <ListIcon icon={iconId} className="h-4 w-4" />
    </button>
  );
}

export function IconPickerGrid({ value, onChange, label }: IconPickerGridProps) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
        {label}
      </legend>
      <div className="grid grid-cols-8 gap-2">
        {LIST_ICON_IDS.map((iconId) => (
          <IconOptionButton key={iconId} iconId={iconId} selected={value === iconId} onSelect={onChange} />
        ))}
      </div>
    </fieldset>
  );
}
