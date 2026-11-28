import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EN_DICTIONARY } from '@/i18n/en';
import { I18nContext } from '@/i18n/i18nContextValue';
import type { UserListSummary } from '@/types/list';
import { ListMembershipModal, type ListMembershipModalProps } from './ListMembershipModal';

function renderMembershipModal(props: ListMembershipModalProps) {
  const value = {
    locale: 'en' as const,
    t: (key: keyof typeof EN_DICTIONARY) => EN_DICTIONARY[key],
    dictionary: EN_DICTIONARY,
    setLocale: async () => {},
  };
  return render(
    <I18nContext.Provider value={value}>
      <ListMembershipModal {...props} />
    </I18nContext.Provider>,
  );
}

const ALL_LISTS: UserListSummary[] = [
  { id: 'p-want', name: 'Want to Watch', description: null, entityType: 'series', systemKey: 'want_to_watch', isSystem: true, icon: 'bookmark', color: 'cyan', tags: [], itemCount: 0, updatedAt: '' },
  { id: 'p-watching', name: 'Watching', description: null, entityType: 'series', systemKey: 'watching', isSystem: true, icon: 'play', color: 'violet', tags: [], itemCount: 0, updatedAt: '' },
  { id: 'c-s1', name: 'Sci-Fi', description: null, entityType: 'series', systemKey: null, isSystem: false, icon: 'rocket', color: 'emerald', tags: [], itemCount: 0, updatedAt: '' },
  { id: 'c-s2', name: 'Weekend', description: null, entityType: 'series', systemKey: null, isSystem: false, icon: 'star', color: 'amber', tags: [], itemCount: 0, updatedAt: '' },
  { id: 'c-p1', name: 'Top Actors', description: null, entityType: 'person', systemKey: null, isSystem: false, icon: 'users', color: 'pink', tags: [], itemCount: 0, updatedAt: '' },
];

describe('ListMembershipModal', () => {
  it('auto-selects Want to Watch when a custom series list is checked and supports undo', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderMembershipModal({
      isOpen: true,
      entityType: 'series',
      entityTitle: 'Dark',
      allLists: ALL_LISTS,
      currentListIds: [],
      onClose: vi.fn(),
      onSave,
    });
    const sciFi = screen.getByRole('checkbox', { name: 'Sci-Fi' });
    await user.click(sciFi);
    expect(sciFi).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Want to Watch' })).toBeChecked();
    await user.click(screen.getByRole('button', { name: 'Undo changes' }));
    expect(sciFi).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Not in any list (remove from all)' })).toBeChecked();
    await user.click(sciFi);
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ primaryStatus: 'want_to_watch', customListIds: ['c-s1'] });
  });

  it('prompts confirmation before clearing primary and custom lists', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderMembershipModal({
      isOpen: true,
      entityType: 'series',
      entityTitle: 'Dark',
      allLists: ALL_LISTS,
      currentListIds: ['p-watching', 'c-s1'],
      onClose: vi.fn(),
      onSave,
    });
    await user.click(screen.getByRole('radio', { name: 'Not in any list (remove from all)' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Remove from all lists?');
    await user.click(screen.getByRole('button', { name: 'Remove from all' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ primaryStatus: null, customListIds: [] });
  });

  it('shows only custom people lists in person mode', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn().mockResolvedValue(undefined);
    renderMembershipModal({
      isOpen: true,
      entityType: 'person',
      entityTitle: 'Bryan Cranston',
      allLists: ALL_LISTS,
      currentListIds: [],
      onClose: vi.fn(),
      onSave,
    });
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Top Actors' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ primaryStatus: null, customListIds: ['c-p1'] });
  });
});
