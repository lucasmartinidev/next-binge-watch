import { AlertCircle } from 'lucide-react';
import { NeonButton } from '@/components/ds/NeonButton';
import { useI18n } from '@/hooks/useI18n';

type ErrorStateProps = {
  message: string;
  onRetry?: () => void;
};

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useI18n();
  return (
    <div role="alert" className="flex flex-col items-center justify-center rounded-hud border border-ds-danger/50 bg-ds-danger/10 px-6 py-8 text-center backdrop-blur-md">
      <AlertCircle className="mb-2 h-7 w-7 text-ds-danger" aria-hidden="true" />
      <p className="text-sm font-medium text-ds-text">{message}</p>
      {onRetry && (
        <NeonButton onClick={onRetry} className="mt-4">
          {t('retry')}
        </NeonButton>
      )}
    </div>
  );
}
