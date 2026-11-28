import { KeyRound } from 'lucide-react';
import { PasswordField } from '@/components/auth/PasswordField';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useI18n } from '@/hooks/useI18n';

export function ChangePasswordView() {
  const { t } = useI18n();
  const form = useChangePassword();
  return (
    <section aria-labelledby="change-password-heading" className="mx-auto max-w-lg rounded-card border border-ds-border bg-ds-surface/85 p-6 shadow-card space-y-5">
      <div className="space-y-1">
        <h1 id="change-password-heading" className="font-display text-2xl font-bold text-ds-text">{t('changePasswordTitle')}</h1>
        <p className="text-sm text-ds-muted">{t('changePasswordSubtitle')}</p>
      </div>
      {form.error ? <p role="alert" className="rounded-control border border-rose-500/50 bg-rose-500/15 px-3.5 py-2.5 text-sm text-rose-200">{form.error}</p> : null}
      {form.success ? <p role="status" className="rounded-control border border-emerald-500/50 bg-emerald-500/15 px-3.5 py-2.5 text-sm text-emerald-200">{form.success}</p> : null}
      <form onSubmit={(e) => void form.handleSubmit(e)} className="space-y-4" noValidate>
        <PasswordField id="current-password" label={t('currentPasswordLabel')} value={form.currentPassword} onChange={form.setCurrentPassword} autoComplete="current-password" />
        <PasswordField id="new-password" label={t('newPasswordLabel')} value={form.newPassword} onChange={form.setNewPassword} autoComplete="new-password" />
        <PasswordField id="confirm-password" label={t('confirmPasswordLabel')} value={form.confirmPassword} onChange={form.setConfirmPassword} autoComplete="new-password" />
        <button type="submit" disabled={form.saving} aria-busy={form.saving} className="min-h-[44px] w-full inline-flex items-center justify-center gap-2 rounded-control bg-ds-accent px-4 py-2 text-sm font-bold text-ds-ink shadow-neon transition hover:brightness-110 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
          <KeyRound className="h-4 w-4" aria-hidden="true" />
          <span>{form.saving ? t('changePasswordSaving') : t('changePasswordSubmit')}</span>
        </button>
      </form>
    </section>
  );
}
