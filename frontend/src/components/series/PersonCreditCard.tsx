import { Link } from 'react-router-dom';
import { MediaImage } from '@/components/common/MediaImage';

type PersonCreditCardProps = {
  personId: number;
  name: string;
  imageUrl: string | null;
  roleLabel: string;
};

export function PersonCreditCard({ personId, name, imageUrl, roleLabel }: PersonCreditCardProps) {
  return (
    <Link to={`/people/${personId}`} className="ds-hud-panel group flex items-center gap-3 rounded-xl p-2.5 backdrop-blur-md transition hover:-translate-y-0.5 hover:border-ds-accent/70 hover:shadow-neon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
      <MediaImage src={imageUrl} alt={name} variant="person" className="h-14 w-11 shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-sm font-semibold text-ds-text group-hover:text-ds-accent">{name}</p>
        <p className="truncate text-xs text-ds-muted">{roleLabel}</p>
      </div>
    </Link>
  );
}
