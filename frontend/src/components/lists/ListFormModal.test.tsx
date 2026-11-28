import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EN_DICTIONARY } from '@/i18n/en';
import { I18nContext } from '@/i18n/i18nContextValue';
import type { UserListSummary } from '@/types/list';
import { ListFormModal, type ListFormModalProps } from './ListFormModal';

function renderModal(props: ListFormModalProps) {
  const value = {
    locale: 'en' as const,
    t: (key: keyof typeof EN_DICTIONARY) => EN_DICTIONARY[key],
    dictionary: EN_DICTIONARY,
    setLocale: async () => {},
  };
  return render(
    <I18nContext.Provider value={value}>
      <ListFormModal {...props} />
    </I18nContext.Provider>,
  );
}

const PRIMARY_LIST: UserListSummary = {
  id: 'p1',
  name: 'Want to Watch',
  description: 'Series you plan to watch',
  entityType: 'series',
  systemKey: 'want_to_watch',
  isSystem: true,
  icon: 'bookmark',
  color: 'cyan',
  tags: [],
  itemCount: 3,
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('ListFormModal', () => {
  it('validates empty name and submits full payload in create mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    renderModal({ isOpen: true, mode: 'create', onSubmit, onClose });
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('List name is required.');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.type(screen.getByLabelText('Name'), 'My Actors');
    await user.type(screen.getByLabelText('Description'), 'Favorite performers');
    await user.click(screen.getByRole('button', { name: 'People' }));
    await user.click(screen.getByRole('button', { name: 'Rocket' }));
    await user.click(screen.getByRole('button', { name: 'Violet' }));
    await user.type(screen.getByLabelText('Tags'), 'scifi{Enter}');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({
      name: 'My Actors',
      description: 'Favorite performers',
      entityType: 'person',
      icon: 'rocket',
      color: 'violet',
      tags: ['scifi'],
    });
    expect(onClose).toHaveBeenCalled();
  });

  it('locks name and description in customize-primary mode and submits icon and color only', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({
      isOpen: true,
      mode: 'customize-primary',
      initialList: PRIMARY_LIST,
      onSubmit,
      onClose: vi.fn(),
    });
    expect(screen.getByLabelText('Name')).toBeDisabled();
    expect(screen.getByLabelText('Description')).toBeDisabled();
    expect(screen.queryByLabelText('Tags')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Flame' }));
    await user.click(screen.getByRole('button', { name: 'Amber' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith({ icon: 'flame', color: 'amber' });
  });

  it('accepts 220-char descriptions and rejects descriptions over 240 characters (BUG-01 regression)', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderModal({ isOpen: true, mode: 'create', onSubmit, onClose: vi.fn() });
    await user.type(screen.getByLabelText('Name'), 'Long Desc List');
    await user.type(screen.getByLabelText('Description'), 'A'.repeat(241));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Description must be 240 characters or fewer.');
    expect(onSubmit).not.toHaveBeenCalled();
    await user.clear(screen.getByLabelText('Description'));
    await user.type(screen.getByLabelText('Description'), 'B'.repeat(220));
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ description: 'B'.repeat(220) }));
  });
});
