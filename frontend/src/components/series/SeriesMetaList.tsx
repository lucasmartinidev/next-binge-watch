import { Star } from 'lucide-react';
import { StatusBadge } from '@/components/common/StatusBadge';
import type { SeriesProfile } from '@/types/series';

export function SeriesMetaList({ series }: { series: SeriesProfile }) {
  const dates = series.premiered ? `${series.premiered}${series.ended ? ` – ${series.ended}` : ''}` : null;
  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        {series.showType && <StatusBadge label={series.showType} tone="accent" />}
        {series.status && <StatusBadge label={series.status} />}
        {series.networkName && <StatusBadge label={series.networkName} />}
        {dates && <span className="font-mono text-xs text-ds-muted">{dates}</span>}
        {series.rating !== null && (
          <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ds-accent">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            {series.rating.toFixed(1)}
          </span>
        )}
      </div>
      {series.genres.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {series.genres.map((genre) => <StatusBadge key={genre} label={genre} tone="accent" />)}
        </div>
      )}
    </div>
  );
}
