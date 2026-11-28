import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/hooks/useI18n';
import { LIST_COLOR_STYLES } from '@/styles/listPalette';
import type { UserListSummary } from '@/types/list';
import { ListIcon } from './ListIcon';

function HeaderActions({ isSystem, onEdit, onDelete }: { isSystem: boolean; onEdit: () => void; onDelete: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex gap-2">
      <button type="button" onClick={onEdit} className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10">
        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{isSystem ? t('listCustomizeAction') : t('listEditAction')}</span>
      </button>
      {!isSystem ? (
        <button type="button" onClick={onDelete} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/40 px-3 py-1.5 text-xs font-semibold text-rose-300 hover:bg-rose-500/15">
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{t('listDeleteAction')}</span>
        </button>
      ) : null}
    </div>
  );
}

export function ListDetailHeader(props: { list: UserListSummary; onEdit: () => void; onDelete: () => void }) {
  const { t } = useI18n();
  const { list, onEdit, onDelete } = props;
  const style = LIST_COLOR_STYLES[list.color];
  const typeLabel = list.isSystem ? t('listPrimaryLockBadge') : list.entityType === 'series' ? t('listBadgeSeriesType') : t('listBadgePersonType');
  return (
    <header className={`space-y-3 rounded-2xl border bg-[var(--ds-surface)] p-5 ${style.border}`}>
      <Link to="/watchlist" className="inline-flex items-center gap-1.5 text-xs font-semibold text-ds-accent hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        <span>{t('listDetailBackLink')}</span>
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border ${style.pill}`}><ListIcon icon={list.icon} className="h-5 w-5" /></span>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{list.name}</h1>
            <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${style.pill}`}>{typeLabel}</span>
          </div>
          {list.description ? <p className="break-words [overflow-wrap:anywhere] text-sm text-[var(--ds-muted)]">{list.description}</p> : null}
          {list.tags.length > 0 ? <div className="flex flex-wrap gap-1.5">{list.tags.map((tag) => <span key={tag} className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-xs text-[var(--ds-muted)]">#{tag}</span>)}</div> : null}
        </div>
        <HeaderActions isSystem={list.isSystem} onEdit={onEdit} onDelete={onDelete} />
      </div>
    </header>
  );
}
