import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { EN_DICTIONARY } from '@/i18n/en';
import { I18nContext } from '@/i18n/i18nContextValue';
import { ConfirmDialog } from './ConfirmDialog';

describe('ConfirmDialog', () => {
  it('calls onConfirm and onCancel including Escape key', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <I18nContext.Provider
        value={{ locale: 'en', t: (k) => EN_DICTIONARY[k], dictionary: EN_DICTIONARY, setLocale: async () => {} }}
      >
        <ConfirmDialog isOpen title="Delete?" description="Cannot undo." onConfirm={onConfirm} onCancel={onCancel} />
      </I18nContext.Provider>,
    );
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Delete?');
    await user.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
