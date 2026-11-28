import { Terminal } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { AuthUser } from '@/types/auth';

type DevLoginPanelProps = { users: AuthUser[]; loading: boolean; submitting: boolean; onSelectUser: (userId: string) => void };
type DevUserRowProps = { user: AuthUser; submitting: boolean; onSelectUser: (userId: string) => void };

function DevUserRow({ user, submitting, onSelectUser }: DevUserRowProps) {
  const { t } = useI18n();
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-control border border-ds-border bg-ds-surface/80 px-3.5 py-2.5">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-sm text-ds-text break-words [overflow-wrap:anywhere]">{user.username}</span>
          <span className="rounded bg-ds-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-ds-accent">{user.role}</span>
          {!user.isActive ? <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-rose-300">{t('devModeInactive')}</span> : null}
        </div>
        <p className="text-xs text-ds-muted break-words [overflow-wrap:anywhere]">{user.email}</p>
      </div>
      <button type="button" disabled={!user.isActive || submitting} onClick={() => onSelectUser(user.id)} className="min-h-[36px] rounded-control bg-amber-400 px-3 py-1.5 text-xs font-bold text-slate-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">
        {t('devModeLoginButton')}
      </button>
    </li>
  );
}

export function DevLoginPanel({ users, loading, submitting, onSelectUser }: DevLoginPanelProps) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="dev-mode-heading" className="rounded-card border border-amber-400/40 bg-amber-500/10 p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded bg-amber-400 px-2 py-0.5 font-mono text-xs font-bold text-slate-950">
            <Terminal className="h-3.5 w-3.5" aria-hidden="true" />
            {t('devModeBadge')}
          </span>
          <h2 id="dev-mode-heading" className="font-display text-base font-bold text-ds-text">{t('devModeTitle')}</h2>
        </div>
        <p className="text-xs text-amber-200/90">{t('devModeDescription')}</p>
      </div>
      {loading ? <p className="text-xs text-ds-muted">{t('loading')}</p> : null}
      {!loading && users.length === 0 ? <p className="text-xs text-ds-muted">{t('devModeEmpty')}</p> : null}
      <ul className="space-y-2">
        {users.map((user) => <DevUserRow key={user.id} user={user} submitting={submitting} onSelectUser={onSelectUser} />)}
      </ul>
    </section>
  );
}
