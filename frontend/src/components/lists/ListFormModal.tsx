import { useId, type FormEvent } from 'react';
import { useEscapeKey } from '@/hooks/useEscapeKey';
import { useListFormState, type ListFormMode } from '@/hooks/useListFormState';
import { useI18n } from '@/hooks/useI18n';
import type { CreateListPayload, ListEntityType, UpdateListPayload, UserListSummary } from '@/types/list';
import { ColorPickerGrid } from './ColorPickerGrid';
import { IconPickerGrid } from './IconPickerGrid';
import { TagChipInput } from './TagChipInput';

export type ListFormModalProps = {
  isOpen: boolean;
  mode: ListFormMode;
  initialList?: UserListSummary | null;
  defaultType?: ListEntityType;
  onClose: () => void;
  onSubmit: (payload: CreateListPayload | UpdateListPayload) => Promise<void>;
};

function TypeSelector({ value, onChange }: { value: ListEntityType; onChange: (t: ListEntityType) => void }) {
  const { t } = useI18n();
  return (
    <fieldset className="space-y-2">
      <legend className="text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">{t('listFormTypeLabel')}</legend>
      <div className="flex gap-2">
        {(['series', 'person'] as const).map((option) => (
          <button key={option} type="button" aria-pressed={value === option} onClick={() => onChange(option)} className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${value === option ? 'border-[var(--ds-accent)] bg-[var(--ds-accent)]/20 text-white' : 'border-white/15 bg-white/5 text-[var(--ds-muted)] hover:bg-white/10'}`}>
            {option === 'series' ? t('listBadgeSeriesType') : t('listBadgePersonType')}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function NameAndDescriptionFields(props: { name: string; description: string; disabled: boolean; onName: (v: string) => void; onDesc: (v: string) => void }) {
  const { t } = useI18n();
  const nameId = useId();
  const descId = useId();
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor={nameId} className="block text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">{t('listFormNameLabel')}</label>
        <input id={nameId} type="text" value={props.name} disabled={props.disabled} onChange={(e) => props.onName(e.target.value)} placeholder={t('listFormNamePlaceholder')} className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white disabled:opacity-60" />
      </div>
      <div className="space-y-1.5">
        <label htmlFor={descId} className="block text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">{t('listFormDescriptionLabel')}</label>
        <textarea id={descId} rows={2} value={props.description} disabled={props.disabled} onChange={(e) => props.onDesc(e.target.value)} placeholder={t('listFormDescriptionPlaceholder')} className="w-full rounded-lg border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-white disabled:opacity-60" />
      </div>
    </>
  );
}

function FormActions({ submitting, onClose }: { submitting: boolean; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className="flex justify-end gap-3 pt-2">
      <button type="button" disabled={submitting} onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 disabled:opacity-50">{t('listCancelAction')}</button>
      <button type="submit" disabled={submitting} className="rounded-lg bg-[var(--ds-accent)] px-4 py-2 text-sm font-semibold text-slate-950 hover:opacity-90 disabled:opacity-50">{submitting ? t('listSavingAction') : t('listSaveAction')}</button>
    </div>
  );
}

function getTitleKey(mode: ListFormMode) {
  if (mode === 'customize-primary') {
    return 'listFormCustomizePrimaryTitle';
  }
  return mode === 'edit' ? 'listFormEditTitle' : 'listFormCreateTitle';
}

export function ListFormModal(props: ListFormModalProps) {
  const { t } = useI18n();
  const titleId = useId();
  const { isOpen, mode, initialList, defaultType, onClose, onSubmit } = props;
  const { fields, setFields, error, submitting, submit } = useListFormState({ isOpen, mode, initialList, defaultType, onSubmit, onClose });
  useEscapeKey(isOpen && !submitting, onClose);
  if (!isOpen) {
    return null;
  }
  const isPrimary = mode === 'customize-primary';
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
      <form role="dialog" aria-modal="true" aria-labelledby={titleId} onSubmit={handleSubmit} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-2xl border border-white/20 bg-slate-950/95 p-6 shadow-2xl backdrop-blur-md">
        <h2 id={titleId} className="text-lg font-bold text-white">{t(getTitleKey(mode))}</h2>
        {isPrimary ? <p className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-3 text-xs text-cyan-200">{t('listFormPrimaryLockedHint')}</p> : null}
        <NameAndDescriptionFields name={fields.name} description={fields.description} disabled={isPrimary} onName={(name) => setFields((f) => ({ ...f, name }))} onDesc={(description) => setFields((f) => ({ ...f, description }))} />
        {mode === 'create' ? <TypeSelector value={fields.entityType} onChange={(entityType) => setFields((f) => ({ ...f, entityType }))} /> : null}
        <IconPickerGrid value={fields.icon} onChange={(icon) => setFields((f) => ({ ...f, icon }))} label={t('listFormIconLabel')} />
        <ColorPickerGrid value={fields.color} onChange={(color) => setFields((f) => ({ ...f, color }))} label={t('listFormColorLabel')} />
        {!isPrimary ? <TagChipInput tags={fields.tags} onChange={(tags) => setFields((f) => ({ ...f, tags }))} label={t('listFormTagsLabel')} /> : null}
        {error ? <p role="alert" className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-2.5 text-xs text-rose-300">{error}</p> : null}
        <FormActions submitting={submitting} onClose={onClose} />
      </form>
    </div>
  );
}
