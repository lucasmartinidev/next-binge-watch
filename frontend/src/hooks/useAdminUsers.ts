import { useCallback, useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { createManagedUser, deleteManagedUser, listManagedUsers, updateManagedUser } from '@/services/userService';
import type { AuthUser, CreateUserFormInput, UserRole } from '@/types/auth';

export function useAdminUsers() {
  const { locale, t } = useI18n();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setUsers(await listManagedUsers(locale)); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t('genericError')); }
    finally { setLoading(false); }
  }, [locale, t]);
  useEffect(() => { void load(); }, [load]);
  const runBusy = async (userId: string, action: () => Promise<void>) => {
    setBusyId(userId);
    setError(null);
    try { await action(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t('genericError')); }
    finally { setBusyId(null); }
  };
  const createUser = async (input: CreateUserFormInput) => { const c = await createManagedUser(input, locale); setUsers((p) => [...p, c]); };
  const changeRole = (userId: string, role: UserRole) => runBusy(userId, async () => { const u = await updateManagedUser(userId, { role }, locale); setUsers((p) => p.map((x) => (x.id === userId ? u : x))); });
  const toggleActive = (userId: string, isActive: boolean) => runBusy(userId, async () => { const u = await updateManagedUser(userId, { isActive }, locale); setUsers((p) => p.map((x) => (x.id === userId ? u : x))); });
  const deleteUser = (userId: string) => runBusy(userId, async () => { await deleteManagedUser(userId, locale); setUsers((p) => p.filter((x) => x.id !== userId)); });
  return { users, loading, error, busyId, load, createUser, changeRole, toggleActive, deleteUser };
}
