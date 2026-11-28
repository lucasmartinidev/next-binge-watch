import { Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MediaImage } from '@/components/common/MediaImage';
import { HudPanel } from '@/components/ds/HudPanel';
import { NeonButton } from '@/components/ds/NeonButton';
import { useI18n } from '@/hooks/useI18n';
import type { PersonListItem } from '@/types/list';
import { ListMembershipBadges } from './ListMembershipBadges';

export type PersonListCardProps = {
  item: PersonListItem;
  onRemove: (personId: number) => void;
};

export function PersonListCard({ item, onRemove }: PersonListCardProps) {
  const { t } = useI18n();
  return (
    <HudPanel as="article" genreTheme="person" className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <Link to={`/people/${item.personId}`} aria-label={item.name} className="shrink-0 self-center rounded sm:self-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ds-accent">
        <MediaImage src={item.imageUrl} alt={item.name} variant="person" className="h-24 w-18 border-ds-accent/40" />
      </Link>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <Link to={`/people/${item.personId}`} className="font-display text-lg font-bold text-ds-text hover:text-ds-accent">
              {item.name}
            </Link>
            {item.country ? <p className="text-xs text-ds-muted">{item.country}</p> : null}
          </div>
          <NeonButton variant="danger" onClick={() => onRemove(item.personId)} ariaLabel={`${t('listDetailRemoveItem')} ${item.name}`} className="min-h-[36px] px-3 py-1 text-xs">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('listDetailRemoveItem')}</span>
          </NeonButton>
        </div>
        <ListMembershipBadges lists={item.lists} />
      </div>
    </HudPanel>
  );
}
