import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EN_DICTIONARY } from '@/i18n/en';
import { I18nContext } from '@/i18n/i18nContextValue';
import * as listService from '@/services/listService';
import type { UserListSummary } from '@/types/list';
import { useListDetail } from './useListDetail';
import { useLists } from './useLists';

vi.mock('@/services/listService');

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nContext.Provider
    value={{ locale: 'en', t: (k) => EN_DICTIONARY[k], dictionary: EN_DICTIONARY, setLocale: async () => {} }}
  >
    {children}
  </I18nContext.Provider>
);

const BASE_LIST: UserListSummary = {
  id: 'l1',
  name: 'Sci-Fi',
  description: null,
  entityType: 'series',
  systemKey: null,
  isSystem: false,
  icon: 'rocket',
  color: 'cyan',
  tags: ['space'],
  itemCount: 1,
  updatedAt: '',
};

describe('useLists and useListDetail', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('loads, creates, updates, and deletes lists in useLists', async () => {
    vi.mocked(listService.getLists).mockResolvedValue({
      primaryLists: [],
      customLists: [BASE_LIST],
      availableTags: ['space'],
    });
    const created: UserListSummary = { ...BASE_LIST, id: 'l2', name: 'Drama' };
    vi.mocked(listService.createList).mockResolvedValue(created);
    vi.mocked(listService.updateList).mockResolvedValue({ ...created, name: 'Updated Drama' });
    vi.mocked(listService.deleteList).mockResolvedValue(undefined);
    const { result } = renderHook(() => useLists(), { wrapper });
    await waitFor(() => expect(result.current.lists).toHaveLength(1));
    await act(async () => {
      await result.current.createNewList({ name: 'Drama', entityType: 'series', icon: 'star', color: 'amber', tags: [] });
    });
    expect(result.current.lists).toHaveLength(2);
    await act(async () => {
      await result.current.updateExistingList('l2', { name: 'Updated Drama' });
    });
    expect(result.current.lists[1]?.name).toBe('Updated Drama');
    await act(async () => {
      await result.current.deleteExistingList('l2');
    });
    expect(result.current.lists).toHaveLength(1);
  });

  it('loads detail, updates metadata, and removes item in useListDetail', async () => {
    vi.mocked(listService.getListDetail).mockResolvedValue({
      list: { ...BASE_LIST, entityType: 'series' },
      items: [{
        seriesId: 10,
        name: 'Dark',
        localizedName: null,
        imageUrl: null,
        genres: [],
        rating: 9,
        status: 'want_to_watch',
        totalEpisodes: 10,
        watchedEpisodes: 0,
        progressPercent: 0,
        tvmazeUrl: 'https://www.tvmaze.com/shows/10/dark',
        nextEpisode: null,
        updatedAt: '',
      }],
    });
    vi.mocked(listService.updateList).mockResolvedValue({ ...BASE_LIST, name: 'Space Opera' });
    vi.mocked(listService.removeListItem).mockResolvedValue(undefined);
    const { result } = renderHook(() => useListDetail('l1'), { wrapper });
    await waitFor(() => expect(result.current.seriesItems).toHaveLength(1));
    await act(async () => {
      await result.current.updateMeta({ name: 'Space Opera' });
      await result.current.removeItem(10);
    });
    expect(result.current.list?.name).toBe('Space Opera');
    expect(result.current.seriesItems).toHaveLength(0);
  });
});
