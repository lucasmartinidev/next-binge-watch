import { useEffect, useId, useMemo, useState } from 'react';
import { toErrorMessage } from '@/hooks/asyncErrors';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useI18n } from '@/hooks/useI18n';
import { useListMembershipEditor } from '@/hooks/useListMembershipEditor';
import type { ListEntityType, UserListSummary } from '@/types/list';
import type { WatchStatus } from '@/types/watchlist';
import { CustomListCheckboxGroup } from './CustomListCheckboxGroup';
import { PrimaryStatusSection } from './PrimaryStatusSection';

export type ListMembershipSavePayload = {
  primaryStatus: WatchStatus | null;
  customListIds: string[];
};

export type ListMembershipModalProps = {
  isOpen: boolean;
  entityType: ListEntityType;
  entityTitle: string;
  allLists: UserListSummary[];
  currentListIds: string[];
  onClose: () => void;
  onSave: (payload: ListMembershipSavePayload) => Promise<void>;
};

function usePartitionedLists(allLists: UserListSummary[], entityType: ListEntityType, currentListIds: string[]) {
  const primaryLists = useMemo(() => allLists.filter((item) => item.isSystem), [allLists]);
  const customLists = useMemo(() => allLists.filter((item) => !item.isSystem && item.entityType === entityType), [allLists, entityType]);
  const initialPrimaryStatus = useMemo(() => primaryLists.find((item) => currentListIds.includes(item.id))?.systemKey ?? null, [primaryLists, currentListIds]);
  const initialCustomListIds = useMemo(() => customLists.filter((item) => currentListIds.includes(item.id)).map((item) => item.id), [customLists, currentListIds]);
  return { primaryLists, customLists, initialPrimaryStatus, initialCustomListIds };
}

function ModalFooter(props: { canUndo: boolean; saving: boolean; onUndo: () => void; onClose: () => void; onSave: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
      <button type="button" disabled={!props.canUndo || props.saving} onClick={props.onUndo} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-medium text-white hover:bg-white/10 disabled:opacity-40">{t('membershipUndoSelectionAction')}</button>
      <div className="flex gap-2">
        <button type="button" disabled={props.saving} onClick={props.onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50">{t('listCancelAction')}</button>
        <button type="button" disabled={props.saving} onClick={props.onSave} className="rounded-lg bg-[var(--ds-accent)] px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50">{props.saving ? t('listSavingAction') : t('listSaveAction')}</button>
      </div>
    </div>
  );
}

function useSaveMembership(onSave: (p: ListMembershipSavePayload) => Promise<void>, onClose: () => void, isOpen: boolean) {
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);
  const save = async (payload: ListMembershipSavePayload) => {
    setSaving(true);
    setError(null);
    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(toErrorMessage(err, t('membershipSaveError')));
    } finally {
      setSaving(false);
    }
  };
  return { saving, error, save };
}

export function ListMembershipModal(props: ListMembershipModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { isOpen, entityType, entityTitle, allLists, currentListIds, onClose, onSave } = props;
  const { primaryLists, customLists, initialPrimaryStatus, initialCustomListIds } = usePartitionedLists(allLists, entityType, currentListIds);
  const editor = useListMembershipEditor({ isOpen, entityType, initialPrimaryStatus, initialCustomListIds });
  const { saving, error, save } = useSaveMembership(onSave, onClose, isOpen);
  useEscapeKey(isOpen && !saving, onClose);
  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-2xl border border-white/20 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-md">
        <h2 id={titleId} className="text-lg font-bold text-white">{t('membershipModalTitle').replace('{title}', entityTitle)}</h2>
        {entityType === 'series' ? <><PrimaryStatusSection primaryLists={primaryLists} selectedPrimaryStatus={editor.selectedPrimaryStatus} onSelect={editor.selectPrimaryStatus} showClearConfirm={editor.showClearConfirm} onConfirmClear={editor.confirmClearAll} onCancelClear={editor.cancelClearAll} /><p className="text-xs text-[var(--ds-muted)]">{t('membershipAutoPrimaryHint')}</p></> : null}
        <CustomListCheckboxGroup heading={entityType === 'series' ? t('membershipCustomSeriesHeading') : t('membershipCustomPeopleHeading')} lists={customLists} selectedIds={editor.selectedCustomIds} onToggle={editor.toggleCustomList} />
        {error ? <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">{error}</p> : null}
        <ModalFooter canUndo={editor.hasChanges} saving={saving} onUndo={editor.undoChanges} onClose={onClose} onSave={() => void save({ primaryStatus: editor.selectedPrimaryStatus, customListIds: editor.selectedCustomIds })} />
      </div>
    </div>
  );
}
