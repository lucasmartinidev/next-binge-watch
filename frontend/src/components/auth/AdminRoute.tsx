import type { ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/common/LoadingState';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

export function AdminRoute({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  if (loading) return <LoadingState />;
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (user?.role !== 'ADMIN') {
    return (
      <section className="mx-auto max-w-lg rounded-card border border-rose-500/40 bg-ds-surface/80 p-6 text-center">
        <h1 className="font-display text-xl font-bold text-ds-text">{t('adminForbiddenTitle')}</h1>
        <p className="mt-2 text-sm text-ds-muted">{t('adminForbiddenBody')}</p>
        <Link to="/" className="mt-4 inline-flex rounded-control bg-ds-accent px-4 py-2 text-sm font-semibold text-ds-ink">
          {t('backHome')}
        </Link>
      </section>
    );
  }
  return <>{children}</>;
}
