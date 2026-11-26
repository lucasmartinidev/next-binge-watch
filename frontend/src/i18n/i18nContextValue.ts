import { createContext } from 'react';
import type { Locale } from '@/types/locale';
import type { TranslationDictionary, TranslationKey } from './en';

export type I18nContextValue = {
  locale: Locale;
  t: (key: TranslationKey) => string;
  dictionary: TranslationDictionary;
  setLocale: (nextLocale: Locale) => Promise<void>;
};

export const I18nContext = createContext<I18nContextValue | null>(null);
