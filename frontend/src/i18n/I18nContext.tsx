import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { getPreferences, updatePreferences } from '@/services/preferencesService';
import type { Locale } from '@/types/locale';
import { detectBrowserLocale } from './detectLocale';
import { EN_DICTIONARY, type TranslationDictionary, type TranslationKey } from './en';
import { I18nContext } from './i18nContextValue';
import { PT_BR_DICTIONARY } from './ptBR';

const DICTIONARIES: Record<Locale, TranslationDictionary> = {
  en: EN_DICTIONARY,
  'pt-BR': PT_BR_DICTIONARY,
};

function usePersistedLocale() {
  const [locale, setLocaleState] = useState<Locale>(() => detectBrowserLocale());
  useEffect(() => {
    let active = true;
    getPreferences()
      .then((prefs) => {
        if (active && prefs.locale) {
          setLocaleState(prefs.locale);
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    await updatePreferences(nextLocale).catch(() => undefined);
  }, []);
  return { locale, setLocale };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { locale, setLocale } = usePersistedLocale();
  const dictionary = DICTIONARIES[locale];
  const t = useCallback((key: TranslationKey) => dictionary[key], [dictionary]);
  return (
    <I18nContext.Provider value={{ locale, t, dictionary, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}
