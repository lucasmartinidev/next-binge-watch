import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { ListFormModal } from '@/components/lists/ListFormModal';
import { ListHubFilters } from '@/components/lists/ListHubFilters';
import { ListSummaryCard } from '@/components/lists/ListSummaryCard';
import type { ListFormMode } from '@/hooks/useListFormState';
import { useI18n } from '@/hooks/useI18n';
import { useLists } from '@/hooks/useLists';
import type { CreateListPayload, ListEntityType, UpdateListPayload, UserListSummary } from '@/types/list';

type FormModalState = { mode: ListFormMode; list: UserListSummary | null } | null;

function PrimaryListsGrid({ lists, onCustomize }: { lists: UserListSummary[]; onCustomize: (l: UserListSummary) => void }) {
  const { t } = useI18n();
  if (lists.length === 0) {
    return null;
  }
  return (
    <section aria-labelledby="primary-lists-heading" className="space-y-3">
      <h2 id="primary-lists-heading" className="font-display text-lg font-bold text-white">{t('listsPrimarySectionTitle')}</h2>
      <div className="grid gap-3.5 sm:grid-cols-3">
        {lists.map((list) => <ListSummaryCard key={list.id} list={list} onCustomize={onCustomize} />)}
      </div>
    </section>
  );
}

function CustomListsSection(props: { lists: UserListSummary[]; typeFilter: ListEntityType | 'all'; tagFilter: string; availableTags: string[]; onType: (t: ListEntityType | 'all') => void; onTag: (tag: string) => void; onCreate: () => void; onEdit: (l: UserListSummary) => void; onDelete: (l: UserListSummary) => void }) {
  const { t } = useI18n();
  return (
    <section aria-labelledby="custom-lists-heading" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="custom-lists-heading" className="font-display text-lg font-bold text-white">{t('listsCustomSectionTitle')}</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <ListHubFilters typeFilter={props.typeFilter} tagFilter={props.tagFilter} availableTags={props.availableTags} onTypeChange={props.onType} onTagChange={props.onTag} />
          <button type="button" onClick={props.onCreate} className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--ds-accent)] px-3.5 py-1.5 text-xs font-semibold text-slate-950 hover:opacity-90">
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{t('listCreateAction')}</span>
          </button>
        </div>
      </div>
      {props.lists.length === 0 ? <p className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-[var(--ds-muted)]">{t('listsCustomEmpty')}</p> : (
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {props.lists.map((list) => <ListSummaryCard key={list.id} list={list} onEdit={props.onEdit} onDelete={props.onDelete} />)}
        </div>
      )}
    </section>
  );
}

export function MyListsHubSection({ onListsChanged }: { onListsChanged?: () => void }) {
  const { t } = useI18n();
  const [typeFilter, setTypeFilter] = useState<ListEntityType | 'all'>('all');
  const [tagFilter, setTagFilter] = useState('');
  const [formState, setFormState] = useState<FormModalState>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserListSummary | null>(null);
  const listsHook = useLists({ type: typeFilter, tag: tagFilter });
  const handleFormSubmit = async (payload: CreateListPayload | UpdateListPayload) => {
    if (formState?.mode === 'create') {
      await listsHook.createNewList(payload as CreateListPayload);
    } else if (formState?.list) {
      await listsHook.updateExistingList(formState.list.id, payload as UpdateListPayload);
      onListsChanged?.();
    }
  };
  return (
    <div className="space-y-6">
      {listsHook.loading ? <LoadingState /> : null}
      {!listsHook.loading && listsHook.error ? <ErrorState message={listsHook.error} onRetry={listsHook.retry} /> : null}
      {!listsHook.loading && !listsHook.error ? (
        <>
          <PrimaryListsGrid lists={listsHook.primaryLists} onCustomize={(list) => setFormState({ mode: 'customize-primary', list })} />
          <CustomListsSection lists={listsHook.customLists} typeFilter={typeFilter} tagFilter={tagFilter} availableTags={listsHook.availableTags} onType={setTypeFilter} onTag={setTagFilter} onCreate={() => setFormState({ mode: 'create', list: null })} onEdit={(list) => setFormState({ mode: 'edit', list })} onDelete={setDeleteTarget} />
        </>
      ) : null}
      <ListFormModal isOpen={formState !== null} mode={formState?.mode ?? 'create'} initialList={formState?.list} onClose={() => setFormState(null)} onSubmit={handleFormSubmit} />
      <ConfirmDialog isOpen={deleteTarget !== null} title={t('listDeleteConfirmTitle').replace('{name}', deleteTarget?.name ?? '')} description={t('listDeleteConfirmBody')} onCancel={() => setDeleteTarget(null)} onConfirm={() => { if (deleteTarget) { void listsHook.deleteExistingList(deleteTarget.id).then(() => onListsChanged?.()); setDeleteTarget(null); } }} />
    </div>
  );
}
