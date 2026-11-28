import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ListDetailHeader } from '@/components/lists/ListDetailHeader';
import { ListFormModal } from '@/components/lists/ListFormModal';
import { PersonListCard } from '@/components/lists/PersonListCard';
import { WatchlistCard } from '@/components/watchlist/WatchlistCard';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { useI18n } from '@/hooks/useI18n';
import { useListDetail } from '@/hooks/useListDetail';
import { deleteList } from '@/services/listService';
import { updateWatchStatus } from '@/services/watchlistService';
import type { UserListSummary } from '@/types/list';
import type { WatchStatus } from '@/types/watchlist';

function DetailItemsList(props: { list: UserListSummary; seriesItems: ReturnType<typeof useListDetail>['seriesItems']; personItems: ReturnType<typeof useListDetail>['personItems']; onChangeStatus: (id: number, s: WatchStatus) => void; onRemove: (id: number) => void }) {
  const { t } = useI18n();
  const isEmpty = props.list.entityType === 'series' ? props.seriesItems.length === 0 : props.personItems.length === 0;
  if (isEmpty) {
    return <EmptyState title={t('listDetailEmptyTitle')} description={t('listDetailEmptyBody')} />;
  }
  return props.list.entityType === 'series' ? (
    <ul className="space-y-3.5">{props.seriesItems.map((item) => <li key={item.seriesId}><WatchlistCard item={item} onChangeStatus={props.onChangeStatus} onRemove={props.onRemove} /></li>)}</ul>
  ) : (
    <ul className="space-y-3.5">{props.personItems.map((item) => <li key={item.personId}><PersonListCard item={item} onRemove={props.onRemove} /></li>)}</ul>
  );
}

export function ListDetailView() {
  const { listId = '' } = useParams();
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const detail = useListDetail(listId);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  usePageGenreTheme('default');
  if (detail.loading) {
    return <LoadingState />;
  }
  if (detail.error || !detail.list) {
    return <ErrorState message={detail.error ?? t('genericError')} onRetry={detail.retry} />;
  }
  const activeList = detail.list;
  const handleStatus = async (seriesId: number, status: WatchStatus) => {
    await updateWatchStatus({ seriesId, status, locale });
    detail.retry();
  };
  return (
    <div className="space-y-6">
      <ListDetailHeader list={activeList} onEdit={() => setEditOpen(true)} onDelete={() => setDeleteOpen(true)} />
      <DetailItemsList list={activeList} seriesItems={detail.seriesItems} personItems={detail.personItems} onChangeStatus={(id, s) => void handleStatus(id, s)} onRemove={(id) => void detail.removeItem(id)} />
      <ListFormModal isOpen={editOpen} mode={activeList.isSystem ? 'customize-primary' : 'edit'} initialList={activeList} onClose={() => setEditOpen(false)} onSubmit={async (payload) => { await detail.updateMeta(payload); }} />
      <ConfirmDialog isOpen={deleteOpen} title={t('listDeleteConfirmTitle').replace('{name}', activeList.name)} description={t('listDeleteConfirmBody')} onCancel={() => setDeleteOpen(false)} onConfirm={() => { void deleteList(activeList.id, locale).then(() => navigate('/watchlist')); }} />
    </div>
  );
}
