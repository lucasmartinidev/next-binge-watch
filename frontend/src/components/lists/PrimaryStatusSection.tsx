import { useI18n } from '@/hooks/useI18n';
import type { UserListSummary } from '@/types/list';
import type { WatchStatus } from '@/types/watchlist';
import { ListIcon } from './ListIcon';

export type PrimaryStatusSectionProps = {
  primaryLists: UserListSummary[];
  selectedPrimaryStatus: WatchStatus | null;
  onSelect: (status: WatchStatus | null) => void;
  showClearConfirm: boolean;
  onConfirmClear: () => void;
  onCancelClear: () => void;
};

function ClearWarningBox({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const { t } = useI18n();
  return (
    <div role="alert" className="rounded-xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-100">
      <p className="font-semibold">{t('membershipClearWarningTitle')}</p>
      <p className="mt-1 text-amber-200/90">{t('membershipClearWarningBody')}</p>
      <div className="mt-2.5 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-white/20 px-2.5 py-1 font-medium text-white hover:bg-white/10">
          {t('listCancelAction')}
        </button>
        <button type="button" onClick={onConfirm} className="rounded-md bg-rose-600 px-2.5 py-1 font-semibold text-white hover:bg-rose-500">
          {t('membershipClearConfirmAction')}
        </button>
      </div>
    </div>
  );
}

export function PrimaryStatusSection(props: PrimaryStatusSectionProps) {
  const { t } = useI18n();
  const { primaryLists, selectedPrimaryStatus, onSelect, showClearConfirm, onConfirmClear, onCancelClear } = props;
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">
        {t('membershipPrimaryHeading')}
      </legend>
      <div className="space-y-1.5">
        {primaryLists.map((list) => (
          <label key={list.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white hover:bg-white/10">
            <input type="radio" name="primary-status" checked={list.systemKey !== null && selectedPrimaryStatus === list.systemKey} onChange={() => onSelect(list.systemKey)} className="accent-[var(--ds-accent)]" />
            <ListIcon icon={list.icon} className="h-4 w-4 text-[var(--ds-accent)]" />
            <span>{list.name}</span>
          </label>
        ))}
        <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-[var(--ds-muted)] hover:bg-white/10">
          <input type="radio" name="primary-status" checked={selectedPrimaryStatus === null} onChange={() => onSelect(null)} className="accent-[var(--ds-accent)]" />
          <span>{t('membershipPrimaryClearOption')}</span>
        </label>
      </div>
      {showClearConfirm ? <ClearWarningBox onConfirm={onConfirmClear} onCancel={onCancelClear} /> : null}
    </fieldset>
  );
}
