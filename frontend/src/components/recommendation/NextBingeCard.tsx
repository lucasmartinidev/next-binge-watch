import { BookmarkCheck, BookmarkPlus, ListChecks, RefreshCw, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaImage } from '@/components/common/MediaImage';
import { StatusBadge } from '@/components/common/StatusBadge';
import { HudPanel } from '@/components/ds/HudPanel';
import { NeonButton } from '@/components/ds/NeonButton';
import { ListMembershipBadges } from '@/components/lists/ListMembershipBadges';
import { useI18n } from '@/hooks/useI18n';
import { resolveGenreTheme } from '@/styles/genreThemes';
import type { NextBingeRecommendation } from '@/types/recommendation';

type NextBingeCardProps = {
  item: NextBingeRecommendation;
  hasMore: boolean;
  onShowAnother: () => void;
  onAdd: () => void;
  onManageLists?: () => void;
};

function NextBingeActions({ item, hasMore, onShowAnother, onAdd, onManageLists }: NextBingeCardProps) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <Link to={`/series/${item.seriesId}`} className="min-h-[40px] inline-flex items-center rounded-control bg-ds-accent px-5 py-2 text-sm font-semibold text-ds-ink shadow-neon transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        {t('nextBingeOpen')}
      </Link>
      <NeonButton variant="secondary" disabled={item.inWatchlist} onClick={onAdd}>
        {item.inWatchlist ? <BookmarkCheck className="h-4 w-4 text-ds-accent" aria-hidden="true" /> : <BookmarkPlus className="h-4 w-4" aria-hidden="true" />}
        <span>{item.inWatchlist ? t('nextBingeAdded') : t('nextBingeAdd')}</span>
      </NeonButton>
      {onManageLists ? (
        <NeonButton variant="secondary" onClick={onManageLists}>
          <ListChecks className="h-4 w-4" aria-hidden="true" />
          <span>{t('listManageAction')}</span>
        </NeonButton>
      ) : null}
      {hasMore && (
        <NeonButton variant="secondary" onClick={onShowAnother}>
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          <span>{t('nextBingeAnother')}</span>
        </NeonButton>
      )}
    </div>
  );
}

export function NextBingeCard({ item, hasMore, onShowAnother, onAdd, onManageLists }: NextBingeCardProps) {
  const displayName = item.localizedName ?? item.name;
  return (
    <HudPanel as="article" genreTheme={resolveGenreTheme(item.genres)} className="flex flex-col gap-5 p-6 shadow-neon sm:flex-row">
      <MediaImage src={item.imageUrl} alt={displayName} variant="series" className="h-56 w-40 shrink-0 self-center border-ds-accent/40 sm:self-start" />
      <div className="flex flex-1 flex-col justify-between gap-4">
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge label={item.reason} tone="accent" />
            {item.rating !== null && (
              <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-ds-accent">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                {item.rating.toFixed(1)}
              </span>
            )}
          </div>
          <h3 className="font-display text-2xl font-bold tracking-tight text-ds-text">{displayName}</h3>
          <ListMembershipBadges lists={item.lists} />
          {item.summary && <p className="line-clamp-3 text-sm leading-relaxed text-ds-muted">{item.summary}</p>}
        </div>
        <NextBingeActions item={item} hasMore={hasMore} onShowAnother={onShowAnother} onAdd={onAdd} onManageLists={onManageLists} />
      </div>
    </HudPanel>
  );
}
