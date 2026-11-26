import { Link } from 'react-router-dom';
import { HudPanel } from '@/components/ds/HudPanel';
import { useI18n } from '@/hooks/useI18n';

export function NotFoundView() {
  const { t } = useI18n();
  return (
    <HudPanel as="section" className="mx-auto flex max-w-lg flex-col items-center justify-center px-6 py-16 text-center">
      <h1 className="font-display text-2xl font-bold text-ds-text">{t('notFoundTitle')}</h1>
      <p className="mt-2 text-sm text-ds-muted">{t('notFoundBody')}</p>
      <Link to="/" className="mt-6 min-h-[40px] inline-flex items-center rounded-control bg-ds-accent px-5 py-2 text-sm font-semibold text-ds-ink shadow-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        {t('backHome')}
      </Link>
    </HudPanel>
  );
}
