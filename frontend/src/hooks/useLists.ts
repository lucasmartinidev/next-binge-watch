import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { createList, deleteList, getLists, updateList } from '@/services/listService';
import type { CreateListPayload, ListEntityType, UpdateListPayload, UserListSummary, UserListsResponse } from '@/types/list';
import type { Locale } from '@/types/locale';
import { useAsyncResource } from './useAsyncResource';
import { useI18n } from './useI18n';

export type UseListsOptions = {
  type?: ListEntityType | 'all';
  tag?: string;
  enabled?: boolean;
};

function replaceList(list: UserListSummary[], updated: UserListSummary): UserListSummary[] {
  return list.map((item) => (item.id === updated.id ? updated : item));
}

function useListMutations(locale: Locale, setData: Dispatch<SetStateAction<UserListsResponse | null>>) {
  const createNewList = useCallback(async (input: CreateListPayload) => {
    const created = await createList(input, locale);
    setData((prev) => (prev ? { ...prev, customLists: [...prev.customLists, created] } : { primaryLists: [], customLists: [created], availableTags: [] }));
    return created;
  }, [locale, setData]);
  const updateExistingList = useCallback(async (listId: string, input: UpdateListPayload) => {
    const updated = await updateList(listId, input, locale);
    setData((prev) => (prev ? { ...prev, primaryLists: replaceList(prev.primaryLists, updated), customLists: replaceList(prev.customLists, updated) } : prev));
    return updated;
  }, [locale, setData]);
  const deleteExistingList = useCallback(async (listId: string) => {
    await deleteList(listId, locale);
    setData((prev) => (prev ? { ...prev, customLists: prev.customLists.filter((item) => item.id !== listId) } : prev));
  }, [locale, setData]);
  return { createNewList, updateExistingList, deleteExistingList };
}

export function useLists(options: UseListsOptions = {}) {
  const { locale } = useI18n();
  const { type = 'all', tag = '', enabled = true } = options;
  const loader = useCallback(
    (signal?: AbortSignal) => getLists({ type: type === 'all' ? undefined : type, tag, locale, signal }),
    [type, tag, locale],
  );
  const resource = useAsyncResource(loader, enabled);
  const mutations = useListMutations(locale, resource.setData);
  const primaryLists = resource.data?.primaryLists ?? [];
  const customLists = resource.data?.customLists ?? [];
  return {
    primaryLists,
    customLists,
    lists: [...primaryLists, ...customLists],
    availableTags: resource.data?.availableTags ?? [],
    loading: resource.loading,
    error: resource.error,
    retry: resource.retry,
    ...mutations,
  };
}
