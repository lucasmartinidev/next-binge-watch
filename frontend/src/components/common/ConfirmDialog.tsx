import { useId } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useI18n } from '@/hooks/useI18n';

export type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  tone?: 'danger' | 'accent';
  onConfirm: () => void;
  onCancel: () => void;
};

type DialogActionsProps = {
  busy: boolean;
  tone: 'danger' | 'accent';
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

function ConfirmDialogActions(props: DialogActionsProps) {
  const { busy, tone, cancelLabel, confirmLabel, onCancel, onConfirm } = props;
  const confirmClass = tone === 'danger'
    ? 'bg-rose-600 hover:bg-rose-500 text-white'
    : 'bg-[var(--ds-accent)] hover:opacity-90 text-slate-950';
  return (
    <div className="mt-6 flex justify-end gap-3">
      <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50">
        {cancelLabel}
      </button>
      <button type="button" disabled={busy} onClick={onConfirm} className={`rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${confirmClass}`}>
        {confirmLabel}
      </button>
    </div>
  );
}

export function ConfirmDialog(props: ConfirmDialogProps) {
  const { t } = useI18n();
  const titleId = useId();
  const descId = useId();
  const { isOpen, title, description, busy = false, tone = 'danger', onConfirm, onCancel } = props;
  useEscapeKey(isOpen && !busy, onCancel);
  if (!isOpen) {
    return null;
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <div role="alertdialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} className="w-full max-w-md rounded-2xl border border-white/20 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-md">
        <h2 id={titleId} className="text-lg font-bold text-white">{title}</h2>
        <p id={descId} className="mt-2 text-sm text-[var(--ds-muted)]">{description}</p>
        <ConfirmDialogActions busy={busy} tone={tone} cancelLabel={props.cancelLabel ?? t('listCancelAction')} confirmLabel={props.confirmLabel ?? t('listConfirmAction')} onCancel={onCancel} onConfirm={onConfirm} />
      </div>
    </div>
  );
}
