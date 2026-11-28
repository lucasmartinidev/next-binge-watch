import { useI18n } from '@/hooks/useI18n';
import type { TranslationKey } from '@/i18n/en';
import { LIST_COLOR_IDS, LIST_COLOR_STYLES } from '@/styles/listPalette';
import type { ListColorId } from '@/types/list';

export type ColorPickerGridProps = {
  value: ListColorId;
  onChange: (color: ListColorId) => void;
  label: string;
};

export function ColorPickerGrid({ value, onChange, label }: ColorPickerGridProps) {
  const { t } = useI18n();
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
        {label}
      </legend>
      <div className="flex flex-wrap gap-2.5">
        {LIST_COLOR_IDS.map((colorId) => {
          const selected = value === colorId;
          const colorLabel = t(`listColor_${colorId}` as TranslationKey);
          const style = LIST_COLOR_STYLES[colorId];
          return (
            <button
              key={colorId}
              type="button"
              aria-label={colorLabel}
              aria-pressed={selected}
              onClick={() => onChange(colorId)}
              className={`h-8 w-8 rounded-full transition ${style.swatch} ${
                selected ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--ds-surface)]' : 'opacity-80 hover:opacity-100'
              }`}
            />
          );
        })}
      </div>
    </fieldset>
  );
}
