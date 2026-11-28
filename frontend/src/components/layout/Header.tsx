import { Tv } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';
import { AccountMenu } from './AccountMenu';
import { LanguageSwitcher } from './LanguageSwitcher';

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return `min-h-[40px] inline-flex items-center rounded-control px-3.5 py-1.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent ${
    isActive
      ? 'bg-ds-accent text-ds-ink shadow-neon'
      : 'text-ds-muted hover:bg-ds-elevated hover:text-ds-text'
  }`;
}

export function Header() {
  const { t } = useI18n();
  const { isAuthenticated } = useAuth();
  return (
    <header className="sticky top-0 z-20 border-b border-ds-accent/25 bg-ds-void/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3.5">
        <Link to="/" className="inline-flex items-center gap-2.5 rounded font-display text-lg font-bold tracking-wider text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-ds-accent/50 bg-ds-accent/15 text-ds-accent shadow-neon">
            <Tv className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>{t('appName')}</span>
        </Link>
        <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-2">
          <NavLink to="/" end className={navLinkClass}>{t('navHome')}</NavLink>
          {isAuthenticated ? <NavLink to="/watchlist" className={navLinkClass}>{t('navWatchlist')}</NavLink> : null}
          <AccountMenu />
          <LanguageSwitcher />
        </nav>
      </div>
    </header>
  );
}
