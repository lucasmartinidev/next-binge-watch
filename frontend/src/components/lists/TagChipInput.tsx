import { useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

export type TagChipInputProps = {
  tags: string[];
  onChange: (tags: string[]) => void;
  label: string;
};

function TagChip({ tag, onRemove }: { tag: string; onRemove: (tag: string) => void }) {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white">
      <span>#{tag}</span>
      <button type="button" aria-label={t('listFormTagRemoveAria').replace('{tag}', tag)} onClick={() => onRemove(tag)} className="rounded-full p-0.5 hover:bg-white/20">
        <X className="h-3 w-3" aria-hidden="true" />
      </button>
    </span>
  );
}

function tryAppendTag(tags: string[], draft: string): { next: string[]; atLimit: boolean; added: boolean } {
  const cleaned = draft.trim();
  if (!cleaned) {
    return { next: tags, atLimit: false, added: false };
  }
  if (tags.length >= 10) {
    return { next: tags, atLimit: true, added: false };
  }
  const exists = tags.some((item) => item.toLowerCase() === cleaned.toLowerCase());
  return { next: exists ? tags : [...tags, cleaned], atLimit: false, added: true };
}

function useTagDraft(tags: string[], onChange: (next: string[]) => void) {
  const [draft, setDraft] = useState('');
  const [limitError, setLimitError] = useState(false);
  const addDraftTag = () => {
    const res = tryAppendTag(tags, draft);
    setLimitError(res.atLimit);
    if (res.added) {
      onChange(res.next);
      setDraft('');
    }
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      addDraftTag();
    }
  };
  const removeTag = (target: string) => {
    onChange(tags.filter((item) => item !== target));
    setLimitError(false);
  };
  return { draft, setDraft, limitError, addDraftTag, onKeyDown, removeTag };
}

export function TagChipInput({ tags, onChange, label }: TagChipInputProps) {
  const { t } = useI18n();
  const inputId = useId();
  const { draft, setDraft, limitError, addDraftTag, onKeyDown, removeTag } = useTagDraft(tags, onChange);
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="block text-xs font-semibold uppercase tracking-wider text-[var(--ds-muted)]">{label}</label>
      <div className="flex gap-2">
        <input id={inputId} type="text" value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={onKeyDown} placeholder={t('listFormTagsPlaceholder')} className="flex-1 rounded-lg border border-white/15 bg-slate-950/60 px-3 py-1.5 text-sm text-white placeholder:text-[var(--ds-muted)]" />
        <button type="button" onClick={addDraftTag} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/10">{t('listFormTagAddAction')}</button>
      </div>
      {limitError ? <p role="alert" className="text-xs text-rose-400">{t('listFormTagsLimitError')}</p> : null}
      {tags.length > 0 ? <div className="flex flex-wrap gap-1.5">{tags.map((tag) => <TagChip key={tag} tag={tag} onRemove={removeTag} />)}</div> : null}
    </div>
  );
}
