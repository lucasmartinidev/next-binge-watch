import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiRequest } from './apiClient';
import {
  createList,
  deleteList,
  getListDetail,
  getLists,
  removeListItem,
  updateList,
  updatePersonLists,
  updateSeriesLists,
} from './listService';

vi.mock('./apiClient', () => ({
  apiRequest: vi.fn(),
}));

const mockedRequest = vi.mocked(apiRequest);

describe('listService', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
    mockedRequest.mockResolvedValue({});
  });

  it('fetches lists with optional type and tag filters', async () => {
    await getLists({ locale: 'en' });
    expect(mockedRequest).toHaveBeenCalledWith('/api/lists', { locale: 'en', signal: undefined });
    await getLists({ type: 'series', tag: 'scifi', locale: 'pt-BR' });
    expect(mockedRequest).toHaveBeenCalledWith('/api/lists?type=series&tag=scifi', {
      locale: 'pt-BR',
      signal: undefined,
    });
  });

  it('handles list CRUD and item removal endpoints', async () => {
    await getListDetail({ listId: 'l1', locale: 'en' });
    expect(mockedRequest).toHaveBeenCalledWith('/api/lists/l1', { locale: 'en', signal: undefined });
    await createList({ name: 'Sci-Fi', entityType: 'series', icon: 'rocket', color: 'cyan', tags: [] }, 'en');
    expect(mockedRequest).toHaveBeenCalledWith('/api/lists', expect.objectContaining({ method: 'POST', locale: 'en' }));
    await updateList('l1', { icon: 'star', color: 'amber' }, 'pt-BR');
    expect(mockedRequest).toHaveBeenCalledWith('/api/lists/l1', expect.objectContaining({ method: 'PATCH', locale: 'pt-BR' }));
    await deleteList('l1', 'en');
    expect(mockedRequest).toHaveBeenCalledWith('/api/lists/l1', { method: 'DELETE', locale: 'en' });
    await removeListItem('l1', 42, 'en');
    expect(mockedRequest).toHaveBeenCalledWith('/api/lists/l1/items/42', { method: 'DELETE', locale: 'en' });
  });

  it('updates series and person list memberships', async () => {
    await updateSeriesLists(10, { primaryStatus: 'watching', customListIds: ['c1'] }, 'en');
    expect(mockedRequest).toHaveBeenCalledWith('/api/series/10/lists', {
      method: 'PUT',
      locale: 'en',
      body: { primaryStatus: 'watching', customListIds: ['c1'] },
    });
    await updatePersonLists(20, { customListIds: ['c2'] }, 'pt-BR');
    expect(mockedRequest).toHaveBeenCalledWith('/api/people/20/lists', {
      method: 'PUT',
      locale: 'pt-BR',
      body: { customListIds: ['c2'] },
    });
  });
});
