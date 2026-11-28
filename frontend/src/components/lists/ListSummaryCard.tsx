import { Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { HudPanel } from '@/components/ds/HudPanel';
import { useI18n } from '@/hooks/useI18n';
import { LIST_COLOR_STYLES } from '@/styles/listPalette';
import type { UserListSummary } from '@/types/list';
import { ListIcon } from './ListIcon';

export type ListSummaryCardProps = {
  list: UserListSummary;
  onCustomize?: (list: UserListSummary) => void;
  onEdit?: (list: UserListSummary) => void;
  onDelete?: (list: UserListSummary) => void;
};

function CardActions({ list, onCustomize, onEdit, onDelete }: ListSummaryCardProps) {
  const { t } = useI18n();
  if (list.isSystem) {
    return (
      <button type="button" onClick={() => onCustomize?.(list)} aria-label={`${t('listCustomizeAction')} ${list.name}`} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10">
        <Pencil className="h-3 w-3" aria-hidden="true" />
        <span>{t('listCustomizeAction')}</span>
      </button>
    );
  }
  return (
    <div className="flex items-center gap-1.5">
      <button type="button" onClick={() => onEdit?.(list)} aria-label={`${t('listEditAction')} ${list.name}`} className="inline-flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/10">
        <Pencil className="h-3 w-3" aria-hidden="true" />
        <span>{t('listEditAction')}</span>
      </button>
      <button type="button" onClick={() => onDelete?.(list)} aria-label={`${t('listDeleteAction')} ${list.name}`} className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 px-2.5 py-1 text-xs font-medium text-rose-300 hover:bg-rose-500/15">
        <Trash2 className="h-3 w-3" aria-hidden="true" />
        <span>{t('listDeleteAction')}</span>
      </button>
    </div>
  );
}

function CardTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, 4).map((tag) => (
        <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] text-[var(--ds-muted)]">#{tag}</span>
      ))}
    </div>
  );
}

export function ListSummaryCard({ list, onCustomize, onEdit, onDelete }: ListSummaryCardProps) {
  const { t } = useI18n();
  const style = LIST_COLOR_STYLES[list.color];
  const typeLabel = list.isSystem ? t('listPrimaryLockBadge') : list.entityType === 'series' ? t('listBadgeSeriesType') : t('listBadgePersonType');
  return (
    <HudPanel as="article" className={`flex min-w-0 flex-col justify-between gap-3 border p-4 ${style.border}`}>
      <div className="min-w-0 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/watchlist/${list.id}`} className="inline-flex min-w-0 items-center gap-2 font-display text-base font-bold text-white hover:text-ds-accent">
            <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${style.pill}`}>
              <ListIcon icon={list.icon} className="h-4 w-4" />
            </span>
            <span className="truncate">{list.name}</span>
          </Link>
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${style.pill}`}>{typeLabel}</span>
        </div>
        {list.description ? <p className="line-clamp-2 break-words [overflow-wrap:anywhere] text-xs text-[var(--ds-muted)]">{list.description}</p> : null}
        <CardTags tags={list.tags} />
      </div>
      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="font-mono text-xs text-[var(--ds-muted)]">{t('listsItemsCount').replace('{count}', String(list.itemCount))}</span>
        <CardActions list={list} onCustomize={onCustomize} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </HudPanel>
  );
}
