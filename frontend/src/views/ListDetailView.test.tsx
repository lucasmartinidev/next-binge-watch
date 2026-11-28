import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import * as listService from '@/services/listService';
import { ListDetailView } from './ListDetailView';

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
}));

describe('ListDetailView (UT-08)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders person list detail items with badges and removes an item', async () => {
    const user = userEvent.setup();
    vi.spyOn(listService, 'getListDetail').mockResolvedValue({
      list: {
        id: 'c-people',
        isSystem: false,
        systemKey: null,
        entityType: 'person',
        name: 'Top Actors',
        description: 'Favorite cast',
        icon: 'users',
        color: 'pink',
        tags: ['actors'],
        itemCount: 1,
        updatedAt: '',
      },
      items: [
        {
          personId: 14229,
          name: 'Bryan Cranston',
          imageUrl: null,
          country: 'United States',
          tvmazeUrl: 'https://www.tvmaze.com/people/14229/bryan-cranston',
          addedAt: '',
          lists: [{ id: 'c-people', name: 'Top Actors', icon: 'users', color: 'pink', isSystem: false, systemKey: null }],
        },
      ],
    });
    const removeSpy = vi.spyOn(listService, 'removeListItem').mockResolvedValue(undefined);
    render(
      <I18nProvider>
        <MemoryRouter initialEntries={['/watchlist/c-people']}>
          <Routes>
            <Route path="/watchlist/:listId" element={<ListDetailView />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
    expect(await screen.findByRole('heading', { name: 'Top Actors' })).toBeInTheDocument();
    expect(screen.getByText('People')).toBeInTheDocument();
    expect(screen.getByText('#actors')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Bryan Cranston' })[0]).toHaveAttribute('href', '/people/14229');
    expect(screen.getByRole('link', { name: 'Top Actors' })).toHaveAttribute('href', '/watchlist/c-people');
    await user.click(screen.getByRole('button', { name: /remove from list bryan cranston/i }));
    expect(removeSpy).toHaveBeenCalledWith('c-people', 14229, 'en');
  });
});
