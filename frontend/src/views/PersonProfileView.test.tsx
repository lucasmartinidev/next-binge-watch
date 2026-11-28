import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n/I18nContext';
import * as personService from '@/services/personService';
import { PersonProfileView } from './PersonProfileView';

vi.mock('@/services/preferencesService', () => ({
  getPreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
  updatePreferences: vi.fn().mockResolvedValue({ locale: 'en', updatedAt: null }),
}));

describe('PersonProfileView (UT-12)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders biographical details, TVmaze link, cast/crew credits linking to /series/:id, and partial warning', async () => {
    vi.spyOn(personService, 'getPersonProfile').mockResolvedValue({
      id: 14229,
      name: 'Bryan Cranston',
      imageUrl: null,
      country: 'United States',
      birthday: '1956-03-07',
      deathday: null,
      gender: 'Male',
      tvmazeUrl: 'https://www.tvmaze.com/people/14229/bryan-cranston',
      castCredits: [
        {
          seriesId: 169,
          seriesName: 'Breaking Bad',
          imageUrl: null,
          premieredYear: '2008',
          role: 'Walter White',
          creditType: 'cast',
          lists: [{ id: 'p-watched', name: 'Watched', icon: 'check-circle', color: 'emerald', isSystem: true, systemKey: 'watched' }],
        },
      ],
      crewCredits: null,
      lists: [{ id: 'c-actors', name: 'Top Actors', icon: 'users', color: 'pink', isSystem: false, systemKey: null }],
      partialData: true,
    });

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={['/people/14229']}>
          <Routes>
            <Route path="/people/:id" element={<PersonProfileView />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByRole('heading', { name: 'Bryan Cranston' })).toBeInTheDocument();
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /tvmaze/i })).toHaveAttribute(
      'href',
      'https://www.tvmaze.com/people/14229/bryan-cranston',
    );
    expect(screen.getByRole('link', { name: /breaking bad/i })).toHaveAttribute('href', '/series/169');
    expect(screen.getByRole('link', { name: 'Top Actors' })).toHaveAttribute('href', '/watchlist/c-actors');
    expect(screen.getByRole('link', { name: 'Watched' })).toHaveAttribute('href', '/watchlist/p-watched');
    expect(screen.getByRole('button', { name: /manage lists/i })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(/some credits could not be loaded/i);
  });

  it('shows error state on failure and retries loading', async () => {
    const user = await import('@testing-library/user-event').then((m) => m.default.setup());
    vi.spyOn(personService, 'getPersonProfile')
      .mockRejectedValueOnce(new Error('Person unavailable'))
      .mockResolvedValueOnce({
        id: 14229,
        name: 'Bryan Cranston',
        imageUrl: null,
        country: null,
        birthday: null,
        deathday: null,
        gender: null,
        tvmazeUrl: 'https://www.tvmaze.com/people/14229',
        castCredits: [],
        crewCredits: [],
        partialData: false,
      });

    render(
      <I18nProvider>
        <MemoryRouter initialEntries={['/people/14229']}>
          <Routes>
            <Route path="/people/:id" element={<PersonProfileView />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );

    expect(await screen.findByText('Person unavailable')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(await screen.findByRole('heading', { name: 'Bryan Cranston' })).toBeInTheDocument();
    expect(screen.getAllByText('No credited series found.')).toHaveLength(2);
  });
});
