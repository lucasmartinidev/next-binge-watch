import { useEffect, useState } from 'react';
import { toErrorMessage } from '@/hooks/asyncErrors';
import { useI18n } from '@/hooks/useI18n';
import type { TranslationKey } from '@/i18n/en';
import type { CreateListPayload, ListColorId, ListEntityType, ListIconId, UpdateListPayload, UserListSummary } from '@/types/list';

export type ListFormMode = 'create' | 'edit' | 'customize-primary';

export type UseListFormStateOptions = {
  isOpen: boolean;
  mode: ListFormMode;
  initialList?: UserListSummary | null;
  defaultType?: ListEntityType;
  onSubmit: (payload: CreateListPayload | UpdateListPayload) => Promise<void>;
  onClose: () => void;
};

type FormFields = { name: string; description: string; entityType: ListEntityType; icon: ListIconId; color: ListColorId; tags: string[] };

function validateListForm(params: { mode: ListFormMode; name: string; description: string; t: (k: TranslationKey) => string }): string | null {
  if (params.mode === 'customize-primary') {
    return null;
  }
  if (!params.name.trim()) {
    return params.t('listFormNameRequiredError');
  }
  if (params.name.trim().length > 60) {
    return params.t('listFormNameTooLongError');
  }
  return params.description.trim().length > 240 ? params.t('listFormDescriptionTooLongError') : null;
}

function buildPayload(mode: ListFormMode, fields: FormFields): CreateListPayload | UpdateListPayload {
  if (mode === 'customize-primary') {
    return { icon: fields.icon, color: fields.color };
  }
  const base: UpdateListPayload = {
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    icon: fields.icon,
    color: fields.color,
    tags: fields.tags,
  };
  return mode === 'create' ? { ...base, name: fields.name.trim(), entityType: fields.entityType } : base;
}

function createInitialFields(initialList?: UserListSummary | null, defaultType: ListEntityType = 'series'): FormFields {
  return {
    name: initialList?.name ?? '',
    description: initialList?.description ?? '',
    entityType: initialList?.entityType ?? defaultType,
    icon: initialList?.icon ?? 'bookmark',
    color: initialList?.color ?? 'cyan',
    tags: initialList?.tags ?? [],
  };
}

export function useListFormState(options: UseListFormStateOptions) {
  const { t } = useI18n();
  const { isOpen, mode, initialList, defaultType = 'series', onSubmit, onClose } = options;
  const [fields, setFields] = useState<FormFields>(() => createInitialFields(initialList, defaultType));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (isOpen) {
      setFields(createInitialFields(initialList, defaultType));
      setError(null);
    }
  }, [isOpen, initialList, defaultType]);
  const submit = async () => {
    const validationError = validateListForm({ mode, name: fields.name, description: fields.description, t });
    if (validationError) {
      return setError(validationError);
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(buildPayload(mode, fields));
      onClose();
    } catch (err) {
      setError(toErrorMessage(err, t('genericError')));
    } finally {
      setSubmitting(false);
    }
  };
  return { fields, setFields, error, submitting, submit };
}
