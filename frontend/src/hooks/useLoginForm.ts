import { useState, type FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

export function useLoginForm() {
  const { login, loginAsDev } = useAuth();
  const { locale, t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const runAuth = async (action: () => Promise<unknown>) => {
    setError(null);
    setSubmitting(true);
    try { await action(); navigate(from, { replace: true }); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : t('genericError')); }
    finally { setSubmitting(false); }
  };
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!identifier.trim()) { setError(t('loginIdentifierRequired')); return; }
    if (!password) { setError(t('loginPasswordRequired')); return; }
    await runAuth(() => login(identifier.trim(), password, locale));
  };
  const handleDevLogin = (userId: string) => runAuth(() => loginAsDev(userId, locale));
  return { identifier, setIdentifier, password, setPassword, error, submitting, handleSubmit, handleDevLogin };
}
