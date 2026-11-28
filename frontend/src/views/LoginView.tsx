import { LogIn } from 'lucide-react';
import { DevLoginPanel } from '@/components/auth/DevLoginPanel';
import { PasswordField } from '@/components/auth/PasswordField';
import { useDevUsers } from '@/hooks/useDevUsers';
import { useI18n } from '@/hooks/useI18n';
import { useLoginForm } from '@/hooks/useLoginForm';

export function LoginView() {
  const { t } = useI18n();
  const form = useLoginForm();
  const dev = useDevUsers();
  return (
    <div className="mx-auto max-w-lg space-y-6">
      <section aria-labelledby="login-heading" className="rounded-card border border-ds-border bg-ds-surface/85 p-6 shadow-card space-y-5">
        <div className="space-y-1">
          <h1 id="login-heading" className="font-display text-2xl font-bold text-ds-text">{t('loginTitle')}</h1>
          <p className="text-sm text-ds-muted">{t('loginSubtitle')}</p>
        </div>
        {form.error ? <p role="alert" className="rounded-control border border-rose-500/50 bg-rose-500/15 px-3.5 py-2.5 text-sm text-rose-200">{form.error}</p> : null}
        <form onSubmit={(e) => void form.handleSubmit(e)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="login-identifier" className="block text-sm font-medium text-ds-text">{t('loginIdentifierLabel')}</label>
            <input id="login-identifier" type="text" autoComplete="username" value={form.identifier} placeholder={t('loginIdentifierPlaceholder')} onChange={(e) => form.setIdentifier(e.target.value)} className="min-h-[42px] w-full rounded-control border border-ds-border bg-ds-void/80 px-3.5 text-sm text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent" />
          </div>
          <PasswordField id="login-password" label={t('loginPasswordLabel')} value={form.password} onChange={form.setPassword} autoComplete="current-password" />
          <button type="submit" disabled={form.submitting} aria-busy={form.submitting} className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-control bg-ds-accent px-4 py-2 text-sm font-bold text-ds-ink shadow-neon transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
            <LogIn className="h-4 w-4" aria-hidden="true" />
            <span>{form.submitting ? t('loginSubmitting') : t('loginSubmit')}</span>
          </button>
        </form>
      </section>
      {dev.enabled ? <DevLoginPanel users={dev.users} loading={dev.loading} submitting={form.submitting} onSelectUser={(id) => void form.handleDevLogin(id)} /> : null}
    </div>
  );
}
