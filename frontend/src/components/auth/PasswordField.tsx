import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useI18n } from '@/hooks/useI18n';

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (nextValue: string) => void;
  autoComplete?: string;
  error?: string | null;
  describedBy?: string;
};

export function PasswordField({ id, label, value, onChange, autoComplete, error, describedBy }: PasswordFieldProps) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const errorId = error ? `${id}-error` : undefined;
  const ariaDescribedBy = [describedBy, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-ds-text">{label}</label>
      <div className="relative">
        <input id={id} type={visible ? 'text' : 'password'} value={value} onChange={(e) => onChange(e.target.value)} autoComplete={autoComplete} aria-invalid={Boolean(error)} aria-describedby={ariaDescribedBy} className="min-h-[42px] w-full rounded-control border border-ds-border bg-ds-void/80 px-3.5 pr-11 text-sm text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent" />
        <button type="button" onClick={() => setVisible((prev) => !prev)} aria-label={visible ? t('loginHidePassword') : t('loginShowPassword')} aria-pressed={visible} className="absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded text-ds-muted hover:text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
          {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
      {error ? <p id={errorId} role="alert" className="text-xs text-rose-300">{error}</p> : null}
    </div>
  );
}
