import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getPreferences, updatePreferences } from '@/services/preferencesService';
import type { Locale } from '@/types/locale';
import { detectBrowserLocale } from './detectLocale';
import { EN_DICTIONARY, type TranslationDictionary, type TranslationKey } from './en';
import { I18nContext } from './i18nContextValue';
import { PT_BR_DICTIONARY } from './ptBR';

const LOCALE_STORAGE_KEY = 'nbw_locale';
const DICTIONARIES: Record<Locale, TranslationDictionary> = { en: EN_DICTIONARY, 'pt-BR': PT_BR_DICTIONARY };

function readInitialLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === 'en' || stored === 'pt-BR') return stored;
  } catch {
    return detectBrowserLocale();
  }
  return detectBrowserLocale();
}

function usePersistedLocale(userId: string | null) {
  const [locale, setLocaleState] = useState<Locale>(readInitialLocale);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    getPreferences()
      .then((prefs) => {
        if (active && prefs.locale) setLocaleState(prefs.locale);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [userId]);
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  const setLocale = useCallback(async (nextLocale: Locale) => {
    setLocaleState(nextLocale);
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, nextLocale);
    } catch {
      void 0;
    }
    if (userId) await updatePreferences(nextLocale).catch(() => undefined);
  }, [userId]);
  return { locale, setLocale };
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { locale, setLocale } = usePersistedLocale(user?.id ?? null);
  const dictionary = DICTIONARIES[locale];
  const t = useCallback((key: TranslationKey) => dictionary[key], [dictionary]);
  return <I18nContext.Provider value={{ locale, t, dictionary, setLocale }}>{children}</I18nContext.Provider>;
}
