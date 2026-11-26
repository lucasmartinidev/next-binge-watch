import { Loader2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export function LoadingState({ label }: { label?: string }) {
  const { t } = useI18n();
  const text = label ?? t('loading');
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex items-center justify-center gap-2.5 py-12 text-ds-accent">
      <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
      <span className="font-mono text-sm font-medium text-ds-muted">{text}</span>
    </div>
  );
}
