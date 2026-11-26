import { useI18n } from '@/hooks/useI18n';
import type { ApiStatus } from '@/types/health';

const STATUS_DOT: Record<ApiStatus, string> = {
  online: 'bg-emerald-400 shadow-[0_0_8px_#34d399]',
  offline: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]',
  checking: 'bg-amber-400 animate-pulse',
};

export function ApiStatusBadge({ status }: { status: ApiStatus }) {
  const { t } = useI18n();
  const label = status === 'online' ? t('statusOnline') : status === 'offline' ? t('statusOffline') : t('statusChecking');
  return (
    <div role="status" aria-live="polite" className="inline-flex items-center gap-2 rounded-full border border-ds-border bg-ds-elevated/90 px-3 py-1 font-mono text-xs font-medium text-ds-text">
      <span aria-hidden="true" className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT[status]}`} />
      <span>{label}</span>
    </div>
  );
}
