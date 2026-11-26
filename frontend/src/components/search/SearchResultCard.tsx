import { Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaImage } from '@/components/common/MediaImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useI18n } from '@/hooks/useI18n';
import { resolveGenreTheme } from '@/styles/genreThemes';
import type { SearchResultItem } from '@/types/search';

export function SearchResultCard({ item }: { item: SearchResultItem }) {
  const { t } = useI18n();
  const targetUrl = item.contentType === 'series' ? `/series/${item.id}` : `/people/${item.id}`;
  const displayName = item.localizedName ?? item.name;
  const typeLabel = item.contentType === 'series' ? t('badgeSeries') : t('badgePerson');
  const cardTheme = resolveGenreTheme(item.genres, item.contentType);
  return (
    <Link to={targetUrl} data-genre-theme={cardTheme} className="ds-hud-panel group flex gap-3.5 rounded-hud p-3.5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-ds-accent/70 hover:shadow-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
      <MediaImage src={item.imageUrl} alt={displayName} variant={item.contentType} className="h-28 w-20 shrink-0" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-display text-sm font-bold text-ds-text group-hover:text-ds-accent">{displayName}</h3>
          <StatusBadge label={typeLabel} tone="accent" />
        </div>
        {item.localizedName && item.localizedName !== item.name && (
          <p className="truncate text-xs text-ds-muted">{item.name}</p>
        )}
        {item.subtitle && <p className="font-mono text-xs text-ds-muted">{item.subtitle}</p>}
        {item.rating !== null && (
          <p className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ds-accent">
            <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
            <span>{item.rating.toFixed(1)}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
