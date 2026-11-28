import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { EN_DICTIONARY } from '@/i18n/en';
import { I18nContext } from '@/i18n/i18nContextValue';
import type { ListBadgeSummary } from '@/types/list';
import { ListMembershipBadges } from './ListMembershipBadges';

function renderWithProviders(lists?: ListBadgeSummary[]) {
  const value = {
    locale: 'en' as const,
    t: (key: keyof typeof EN_DICTIONARY) => EN_DICTIONARY[key],
    dictionary: EN_DICTIONARY,
    setLocale: async () => {},
  };
  return render(
    <I18nContext.Provider value={value}>
      <MemoryRouter>
        <ListMembershipBadges lists={lists} />
      </MemoryRouter>
    </I18nContext.Provider>,
  );
}

const SAMPLE_LISTS: ListBadgeSummary[] = [
  { id: 'c1', name: 'Sci-Fi', systemKey: null, icon: 'rocket', color: 'cyan', isSystem: false },
  { id: 'c2', name: 'Weekend', systemKey: null, icon: 'star', color: 'amber', isSystem: false },
  { id: 'p1', name: 'Watching', systemKey: 'watching', icon: 'play', color: 'violet', isSystem: true },
  { id: 'c3', name: 'Classics', systemKey: null, icon: 'film', color: 'pink', isSystem: false },
  { id: 'c4', name: 'Top 10', systemKey: null, icon: 'trophy', color: 'emerald', isSystem: false },
];

describe('ListMembershipBadges', () => {
  it('renders nothing when lists is empty or undefined', () => {
    const { container: emptyContainer } = renderWithProviders([]);
    expect(emptyContainer).toBeEmptyDOMElement();
    const { container: undefContainer } = renderWithProviders(undefined);
    expect(undefContainer).toBeEmptyDOMElement();
  });

  it('prioritizes primary list first and links up to 3 badges inline', () => {
    renderWithProviders(SAMPLE_LISTS.slice(0, 3));
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent('Watching');
    expect(links[0]).toHaveAttribute('href', '/watchlist/p1');
    expect(links[1]).toHaveAttribute('href', '/watchlist/c1');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows +N more overflow trigger and reveals remaining badges on click', async () => {
    const user = userEvent.setup();
    renderWithProviders(SAMPLE_LISTS);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    const overflowBtn = screen.getByRole('button', { name: '+2 more' });
    expect(overflowBtn).toHaveAttribute('aria-expanded', 'false');
    await user.click(overflowBtn);
    expect(overflowBtn).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Classics' })).toHaveAttribute('href', '/watchlist/c3');
    expect(screen.getByRole('link', { name: 'Top 10' })).toHaveAttribute('href', '/watchlist/c4');
  });
});
