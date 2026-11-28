import { useState, type FormEvent } from 'react';
import { useI18n } from '@/hooks/useI18n';
import type { TranslationKey } from '@/i18n/en';
import { changeOwnPassword } from '@/services/authService';
import { validatePlainPassword } from '@/services/passwordHasher';

function validateChangeInput(
  input: { currentPassword: string; newPassword: string; confirmPassword: string },
  t: (key: TranslationKey) => string,
): string | null {
  if (!input.currentPassword) return t('loginPasswordRequired');
  const lengthErr = validatePlainPassword(input.newPassword);
  if (lengthErr === 'minLength') return t('passwordMinLengthError');
  if (lengthErr === 'maxLength') return t('passwordMaxLengthError');
  if (input.newPassword !== input.confirmPassword) return t('passwordMismatchError');
  if (input.newPassword === input.currentPassword) return t('passwordSameError');
  return null;
}

export function useChangePassword() {
  const { locale, t } = useI18n();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSuccess(null);
    const validationError = validateChangeInput({ currentPassword, newPassword, confirmPassword }, t);
    if (validationError) { setError(validationError); return; }
    setError(null);
    setSaving(true);
    try {
      await changeOwnPassword({ currentPassword, newPassword, locale });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setSuccess(t('changePasswordSuccess'));
    } catch (err: unknown) { setError(err instanceof Error ? err.message : t('genericError')); }
    finally { setSaving(false); }
  };
  return { currentPassword, setCurrentPassword, newPassword, setNewPassword, confirmPassword, setConfirmPassword, error, success, saving, handleSubmit };
}
