import { UserPlus } from 'lucide-react';
import { useState } from 'react';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { UserTable } from '@/components/admin/UserTable';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { useAdminUsers } from '@/hooks/useAdminUsers';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import type { AuthUser } from '@/types/auth';

export function AdminUsersView() {
  const { t } = useI18n();
  const { user: currentUser } = useAuth();
  const admin = useAdminUsers();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AuthUser | null>(null);
  return (
    <section aria-labelledby="admin-users-heading" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 id="admin-users-heading" className="font-display text-2xl font-bold text-ds-text">{t('adminUsersTitle')}</h1>
          <p className="text-sm text-ds-muted">{t('adminUsersSubtitle')}</p>
        </div>
        <button type="button" onClick={() => setCreateOpen(true)} className="min-h-[42px] inline-flex items-center gap-2 rounded-control bg-ds-accent px-4 py-2 text-sm font-bold text-ds-ink shadow-neon hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          <span>{t('adminCreateUserButton')}</span>
        </button>
      </div>
      {admin.error ? <ErrorState message={admin.error} onRetry={() => void admin.load()} /> : null}
      {admin.loading ? <LoadingState /> : <UserTable users={admin.users} currentUserId={currentUser?.id ?? null} busyId={admin.busyId} onChangeRole={(id, role) => void admin.changeRole(id, role)} onToggleActive={(id, next) => void admin.toggleActive(id, next)} onRequestDelete={setDeleteTarget} />}
      <CreateUserModal isOpen={createOpen} onClose={() => setCreateOpen(false)} onCreate={admin.createUser} />
      <ConfirmDialog isOpen={Boolean(deleteTarget)} title={t('adminDeleteConfirmTitle')} description={`${t('adminDeleteConfirmBody')} (${deleteTarget?.username ?? ''})`} confirmLabel={t('adminDeleteConfirmButton')} onCancel={() => setDeleteTarget(null)} onConfirm={() => { const id = deleteTarget?.id; setDeleteTarget(null); if (id) void admin.deleteUser(id); }} />
    </section>
  );
}
