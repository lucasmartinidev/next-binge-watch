import { useState, type FormEvent } from 'react';
import { PasswordField } from '@/components/auth/PasswordField';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useI18n } from '@/hooks/useI18n';
import type { TranslationKey } from '@/i18n/en';
import { validatePlainPassword } from '@/services/passwordHasher';
import type { CreateUserFormInput, UserRole } from '@/types/auth';

const USERNAME_REGEX = /^[A-Za-z0-9-]{1,39}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;

type CreateUserModalProps = { isOpen: boolean; onClose: () => void; onCreate: (input: CreateUserFormInput) => Promise<void> };
type FormFieldsProps = {
  username: string; email: string; role: UserRole; password: string; saving: boolean;
  onUsername: (v: string) => void; onEmail: (v: string) => void; onRole: (v: UserRole) => void; onPassword: (v: string) => void; onClose: () => void;
};

function validateCreateInput(input: CreateUserFormInput, t: (key: TranslationKey) => string): string | null {
  if (!USERNAME_REGEX.test(input.username.trim())) return t('adminUsernameInvalidError');
  const cleanEmail = input.email.trim();
  if (!cleanEmail || cleanEmail.length > MAX_EMAIL_LENGTH || !EMAIL_REGEX.test(cleanEmail)) return t('adminEmailInvalidError');
  const pwErr = validatePlainPassword(input.password);
  if (pwErr === 'minLength') return t('passwordMinLengthError');
  if (pwErr === 'maxLength') return t('passwordMaxLengthError');
  return null;
}

function CreateUserFormFields(props: FormFieldsProps) {
  const { t } = useI18n();
  const fieldCls = 'min-h-[40px] w-full rounded-control border border-ds-border bg-ds-void/80 px-3 text-sm text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent';
  return (
    <>
      <div className="space-y-1">
        <label htmlFor="create-username" className="block text-sm font-medium text-ds-text">{t('adminUsernameLabel')}</label>
        <input id="create-username" type="text" maxLength={39} value={props.username} onChange={(e) => props.onUsername(e.target.value)} className={fieldCls} />
        <p className="text-xs text-ds-muted">{t('adminUsernameHint')}</p>
      </div>
      <div className="space-y-1">
        <label htmlFor="create-email" className="block text-sm font-medium text-ds-text">{t('adminEmailLabel')}</label>
        <input id="create-email" type="email" maxLength={254} value={props.email} onChange={(e) => props.onEmail(e.target.value)} className={fieldCls} />
      </div>
      <div className="space-y-1">
        <label htmlFor="create-role" className="block text-sm font-medium text-ds-text">{t('adminRoleLabel')}</label>
        <select id="create-role" value={props.role} onChange={(e) => props.onRole(e.target.value as UserRole)} className={fieldCls}>
          <option value="USER">{t('roleUser')}</option>
          <option value="ADMIN">{t('roleAdmin')}</option>
        </select>
      </div>
      <PasswordField id="create-password" label={t('loginPasswordLabel')} value={props.password} onChange={props.onPassword} autoComplete="new-password" />
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={props.onClose} className="min-h-[40px] rounded-control border border-ds-border px-4 py-1.5 text-sm font-semibold text-ds-muted hover:text-ds-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">{t('adminCancelButton')}</button>
        <button type="submit" disabled={props.saving} aria-busy={props.saving} className="min-h-[40px] rounded-control bg-ds-accent px-4 py-1.5 text-sm font-bold text-ds-ink shadow-neon disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">{props.saving ? t('adminCreateSaving') : t('adminCreateSubmit')}</button>
      </div>
    </>
  );
}

export function CreateUserModal({ isOpen, onClose, onCreate }: CreateUserModalProps) {
  const { t } = useI18n();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEscapeKey(isOpen, onClose);
  if (!isOpen) return null;
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateCreateInput({ username, email, role, password }, t);
    if (validationError) { setError(validationError); return; }
    setError(null); setSaving(true);
    try {
      await onCreate({ username: username.trim(), email: email.trim().toLowerCase(), role, password });
      setUsername(''); setEmail(''); setRole('USER'); setPassword(''); onClose();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t('genericError')); } finally { setSaving(false); }
  };
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="create-user-title" className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4 backdrop-blur-md">
      <div className="w-full max-w-md rounded-card border border-ds-border bg-ds-surface p-6 shadow-card space-y-4">
        <h2 id="create-user-title" className="font-display text-xl font-bold text-ds-text">{t('adminCreateModalTitle')}</h2>
        {error ? <p role="alert" className="rounded-control border border-rose-500/50 bg-rose-500/15 px-3 py-2 text-sm text-rose-200">{error}</p> : null}
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5" noValidate><CreateUserFormFields username={username} email={email} role={role} password={password} saving={saving} onUsername={setUsername} onEmail={setEmail} onRole={setRole} onPassword={setPassword} onClose={onClose} /></form>
      </div>
    </div>
  );
}
