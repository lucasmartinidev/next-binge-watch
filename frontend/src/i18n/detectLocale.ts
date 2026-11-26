import { DEFAULT_LOCALE, type Locale } from '@/types/locale';

export function mapBrowserLanguage(rawLocale: string): Locale | null {
  const normalized = rawLocale.trim().toLowerCase();
  if (normalized === 'pt' || normalized.startsWith('pt-')) {
    return 'pt-BR';
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }
  return null;
}

export function detectBrowserLocale(languages?: readonly string[]): Locale {
  const candidates = languages ?? (typeof navigator !== 'undefined' ? navigator.languages : []);
  for (const candidate of candidates) {
    const matched = mapBrowserLanguage(candidate);
    if (matched) {
      return matched;
    }
  }
  if (typeof navigator !== 'undefined' && navigator.language) {
    return mapBrowserLanguage(navigator.language) ?? DEFAULT_LOCALE;
  }
  return DEFAULT_LOCALE;
}
