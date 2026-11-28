import { Trash2 } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import type { AuthUser, UserRole } from '@/types/auth';

type UserRowProps = {
  user: AuthUser;
  isSelf: boolean;
  busy: boolean;
  onChangeRole: (userId: string, role: UserRole) => void;
  onToggleActive: (userId: string, nextActive: boolean) => void;
  onRequestDelete: (user: AuthUser) => void;
};

export function UserRow({ user, isSelf, busy, onChangeRole, onToggleActive, onRequestDelete }: UserRowProps) {
  const { t } = useI18n();
  const disabled = isSelf || busy;
  return (
    <li className="flex flex-col gap-3 rounded-card border border-ds-border bg-ds-surface/80 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-ds-text break-words [overflow-wrap:anywhere]">{user.username}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${user.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>{user.isActive ? t('adminStatusActive') : t('adminStatusInactive')}</span>
          {isSelf ? <span className="rounded-full bg-ds-accent/20 px-2 py-0.5 text-xs font-semibold text-ds-accent">{t('adminSelfLabel')}</span> : null}
        </div>
        <p className="text-xs text-ds-muted break-words [overflow-wrap:anywhere]">{user.email}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select aria-label={`${t('adminRoleLabel')} ${user.username}`} value={user.role} disabled={disabled} onChange={(e) => onChangeRole(user.id, e.target.value as UserRole)} className="min-h-[38px] rounded-control border border-ds-border bg-ds-void/80 px-2.5 text-xs font-semibold text-ds-text disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
          <option value="USER">{t('roleUser')}</option>
          <option value="ADMIN">{t('roleAdmin')}</option>
        </select>
        <button type="button" disabled={disabled} onClick={() => onToggleActive(user.id, !user.isActive)} className="min-h-[38px] rounded-control border border-ds-border px-3 py-1.5 text-xs font-semibold text-ds-text hover:bg-ds-elevated disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">{user.isActive ? t('adminDeactivate') : t('adminReactivate')}</button>
        <button type="button" disabled={disabled} aria-label={`${t('adminDelete')} ${user.username}`} onClick={() => onRequestDelete(user)} className="min-h-[38px] inline-flex items-center gap-1 rounded-control border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('adminDelete')}</span>
        </button>
      </div>
    </li>
  );
}
