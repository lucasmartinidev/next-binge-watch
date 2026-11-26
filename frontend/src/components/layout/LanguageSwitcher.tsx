import { useI18n } from '@/hooks/useI18n';
import type { Locale } from '@/types/locale';

const LOCALES: readonly { code: Locale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'pt-BR', label: 'PT-BR' },
];

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t('languageLabel')} className="inline-flex rounded-control border border-ds-border bg-ds-elevated/80 p-0.5">
      {LOCALES.map((item) => {
        const active = locale === item.code;
        return (
          <button
            key={item.code}
            type="button"
            aria-pressed={active}
            onClick={() => void setLocale(item.code)}
            className={`min-h-[36px] rounded-md px-2.5 py-1 font-mono text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent ${
              active ? 'bg-ds-accent text-ds-ink shadow-neon' : 'text-ds-muted hover:text-ds-text'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
