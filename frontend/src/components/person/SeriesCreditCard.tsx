import { Link } from 'react-router-dom';
import { MediaImage } from '@/components/common/MediaImage';
import { ListMembershipBadges } from '@/components/lists/ListMembershipBadges';
import type { PersonSeriesCredit } from '@/types/person';

export function SeriesCreditCard({ credit }: { credit: PersonSeriesCredit }) {
  return (
    <article className="ds-hud-panel group flex flex-col gap-2 rounded-xl p-2.5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-ds-accent/70 hover:shadow-neon">
      <Link to={`/series/${credit.seriesId}`} className="flex items-center gap-3 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        <MediaImage src={credit.imageUrl} alt={credit.seriesName} variant="series" className="h-20 w-14 shrink-0" />
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="truncate font-display text-sm font-semibold text-ds-text group-hover:text-ds-accent">{credit.seriesName}</p>
          {credit.role ? <p className="truncate text-xs text-ds-muted">{credit.role}</p> : null}
          {credit.premieredYear ? <p className="font-mono text-xs text-ds-accent/90">{credit.premieredYear}</p> : null}
        </div>
      </Link>
      <ListMembershipBadges lists={credit.lists} />
    </article>
  );
}
