import { KeyRound, LogIn, LogOut, Users } from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

function itemClass({ isActive }: { isActive: boolean }): string {
  return `min-h-[40px] inline-flex items-center gap-1.5 rounded-control px-3 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent ${
    isActive ? 'bg-ds-accent text-ds-ink shadow-neon' : 'text-ds-muted hover:bg-ds-elevated hover:text-ds-text'
  }`;
}

function SignInLink({ label }: { label: string }) {
  return (
    <Link to="/login" className="min-h-[40px] inline-flex items-center gap-1.5 rounded-control border border-ds-accent/50 bg-ds-accent/15 px-3.5 py-1.5 text-sm font-semibold text-ds-accent hover:bg-ds-accent/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
      <LogIn className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </Link>
  );
}

export function AccountMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  if (!isAuthenticated || !user) return <SignInLink label={t('navSignIn')} />;
  const handleLogout = async () => { await logout(); navigate('/'); };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {user.role === 'ADMIN' ? (
        <NavLink to="/admin/users" className={itemClass}><Users className="h-4 w-4" aria-hidden="true" /><span>{t('navUsers')}</span></NavLink>
      ) : null}
      <NavLink to="/account/password" className={itemClass}><KeyRound className="h-4 w-4" aria-hidden="true" /><span>{t('navChangePassword')}</span></NavLink>
      <span className="inline-flex items-center gap-1.5 rounded-full border border-ds-border bg-ds-elevated/80 px-2.5 py-1 text-xs font-medium text-ds-text">
        <span className="max-w-[120px] truncate">{user.username}</span>
        <span className="rounded bg-ds-accent/20 px-1.5 py-0.5 text-[10px] font-bold text-ds-accent">{user.role}</span>
      </span>
      <button type="button" onClick={() => void handleLogout()} className="min-h-[40px] inline-flex items-center gap-1.5 rounded-control border border-ds-border px-3 py-1.5 text-sm font-semibold text-ds-muted hover:bg-ds-elevated hover:text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span>{t('navSignOut')}</span>
      </button>
    </div>
  );
}
