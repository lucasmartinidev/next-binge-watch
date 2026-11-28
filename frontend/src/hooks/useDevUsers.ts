import { useEffect, useState } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { listDevUsers } from '@/services/authService';
import type { AuthUser } from '@/types/auth';

const LOCAL_HOSTNAMES = new Set(['localhost', '127.0.0.1']);

export function isDevAuthUiEnabled(isDevBuild = import.meta.env.DEV, hostname?: string): boolean {
  const host = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  return Boolean(isDevBuild) && LOCAL_HOSTNAMES.has(host.toLowerCase());
}

export function useDevUsers() {
  const { locale } = useI18n();
  const enabled = isDevAuthUiEnabled();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(enabled);
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    listDevUsers(locale)
      .then((list) => {
        if (active) setUsers(list);
      })
      .catch(() => {
        if (active) setUsers([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [enabled, locale]);
  return { enabled, users, loading };
}
