import { useApiHealth } from '@/hooks/useApiHealth';
import { useI18n } from '@/hooks/useI18n';
import { ApiStatusBadge } from './ApiStatusBadge';

export function FooterAttribution() {
  const { t } = useI18n();
  const apiStatus = useApiHealth();
  return (
    <footer className="border-t border-ds-border bg-ds-void/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-ds-muted sm:flex-row">
        <p className="text-center sm:text-left">
          {t('attributionPrefix')}{' '}
          <a href="https://www.tvmaze.com" target="_blank" rel="noopener noreferrer" className="rounded font-semibold text-ds-accent underline underline-offset-4 hover:brightness-125 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
            TVmaze
          </a>{' '}
          {t('attributionLicense')}
        </p>
        <ApiStatusBadge status={apiStatus} />
      </div>
    </footer>
  );
}
