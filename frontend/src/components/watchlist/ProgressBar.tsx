import { useI18n } from '@/hooks/useI18n';

type ProgressBarProps = {
  watched: number;
  total: number;
  percent: number;
};

export function ProgressBar({ watched, total, percent }: ProgressBarProps) {
  const { t } = useI18n();
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between font-mono text-xs font-medium text-ds-muted">
        <span>{watched} / {total} {t('watchlistEpisodesProgress')}</span>
        <span className="text-ds-accent">{percent}%</span>
      </div>
      <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} className="h-2.5 w-full overflow-hidden rounded-full border border-ds-border bg-ds-elevated">
        <div className="h-full rounded-full bg-ds-accent shadow-neon transition-all duration-300" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
