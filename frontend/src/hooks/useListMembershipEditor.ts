import { useCallback, useEffect, useState } from 'react';
import type { ListEntityType } from '@/types/list';
import type { WatchStatus } from '@/types/watchlist';

export type UseListMembershipEditorOptions = {
  isOpen: boolean;
  entityType: ListEntityType;
  initialPrimaryStatus: WatchStatus | null;
  initialCustomListIds: string[];
};

type EditorState = { primaryStatus: WatchStatus | null; customIds: string[]; showClearConfirm: boolean };

function sameIdSets(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id) => b.includes(id));
}

function toggleCustomState(prev: EditorState, listId: string, entityType: ListEntityType): EditorState {
  const exists = prev.customIds.includes(listId);
  const nextCustomIds = exists ? prev.customIds.filter((id) => id !== listId) : [...prev.customIds, listId];
  const nextPrimary = !exists && entityType === 'series' ? (prev.primaryStatus ?? 'want_to_watch') : prev.primaryStatus;
  return { primaryStatus: nextPrimary, customIds: nextCustomIds, showClearConfirm: false };
}

export function useListMembershipEditor(options: UseListMembershipEditorOptions) {
  const { isOpen, entityType, initialPrimaryStatus, initialCustomListIds } = options;
  const [state, setState] = useState<EditorState>({ primaryStatus: initialPrimaryStatus, customIds: initialCustomListIds, showClearConfirm: false });
  useEffect(() => {
    if (isOpen) {
      setState({ primaryStatus: initialPrimaryStatus, customIds: initialCustomListIds, showClearConfirm: false });
    }
  }, [isOpen, initialPrimaryStatus, initialCustomListIds]);
  const toggleCustomList = useCallback((listId: string) => setState((prev) => toggleCustomState(prev, listId, entityType)), [entityType]);
  const selectPrimaryStatus = useCallback((status: WatchStatus | null) => {
    setState((prev) => (status === null && prev.customIds.length > 0 ? { ...prev, showClearConfirm: true } : { ...prev, primaryStatus: status, showClearConfirm: false }));
  }, []);
  const confirmClearAll = useCallback(() => setState({ primaryStatus: null, customIds: [], showClearConfirm: false }), []);
  const cancelClearAll = useCallback(() => setState((prev) => ({ ...prev, showClearConfirm: false })), []);
  const undoChanges = useCallback(() => setState({ primaryStatus: initialPrimaryStatus, customIds: initialCustomListIds, showClearConfirm: false }), [initialPrimaryStatus, initialCustomListIds]);
  const hasChanges = state.primaryStatus !== initialPrimaryStatus || !sameIdSets(state.customIds, initialCustomListIds);
  return {
    selectedPrimaryStatus: state.primaryStatus,
    selectedCustomIds: state.customIds,
    showClearConfirm: state.showClearConfirm,
    hasChanges,
    toggleCustomList,
    selectPrimaryStatus,
    confirmClearAll,
    cancelClearAll,
    undoChanges,
  };
}
