import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { LIST_COLOR_STYLES } from '@/styles/listPalette';
import type { ListBadgeSummary } from '@/types/list';
import { ListIcon } from './ListIcon';

export type ListMembershipBadgesProps = {
  lists?: ListBadgeSummary[];
  maxVisible?: number;
};

function sortSystemFirst(lists: ListBadgeSummary[]): ListBadgeSummary[] {
  return [...lists].sort((a, b) => Number(b.isSystem) - Number(a.isSystem));
}

function BadgeLink({ badge }: { badge: ListBadgeSummary }) {
  const style = LIST_COLOR_STYLES[badge.color];
  return (
    <Link to={`/watchlist/${badge.id}`} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition hover:opacity-90 ${style.pill}`}>
      <ListIcon icon={badge.icon} className="h-3 w-3 shrink-0" />
      <span>{badge.name}</span>
    </Link>
  );
}

function OverflowPopover({ overflow }: { overflow: ListBadgeSummary[] }) {
  const { t } = useI18n();
  return (
    <div role="region" aria-label={t('listInListsAria')} className="absolute left-0 top-full z-30 mt-1.5 flex min-w-44 flex-wrap gap-1.5 rounded-xl border border-white/20 bg-slate-950/95 p-2.5 shadow-2xl backdrop-blur-md">
      {overflow.map((badge) => <BadgeLink key={badge.id} badge={badge} />)}
    </div>
  );
}

function OverflowDisclosure({ overflow }: { overflow: ListBadgeSummary[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  if (overflow.length === 0) {
    return null;
  }
  const label = t('listOverflowMoreLabel').replace('{count}', String(overflow.length));
  return (
    <div className="relative inline-flex">
      <button type="button" aria-expanded={open} onClick={() => setOpen((prev) => !prev)} className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs font-medium text-white hover:bg-white/10">
        {label}
      </button>
      {open ? <OverflowPopover overflow={overflow} /> : null}
    </div>
  );
}

export function ListMembershipBadges({ lists, maxVisible = 3 }: ListMembershipBadgesProps) {
  const { t } = useI18n();
  if (!lists || lists.length === 0) {
    return null;
  }
  const sorted = sortSystemFirst(lists);
  return (
    <div aria-label={t('listInListsAria')} className="flex flex-wrap items-center gap-1.5">
      {sorted.slice(0, maxVisible).map((badge) => <BadgeLink key={badge.id} badge={badge} />)}
      <OverflowDisclosure overflow={sorted.slice(maxVisible)} />
    </div>
  );
}
