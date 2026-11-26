import type { MessageKey } from '../types/error';
import { DEFAULT_LOCALE, type Locale } from '../types/locale';
import { EN_MESSAGES } from './enMessages';
import { PT_BR_MESSAGES } from './ptBrMessages';

const MESSAGE_CATALOGS: Record<Locale, Record<MessageKey, string>> = {
  en: EN_MESSAGES,
  'pt-BR': PT_BR_MESSAGES,
};

function parseLocaleCandidate(value: string): Locale | null {
  const normalized = value.trim().toLowerCase();
  if (normalized === 'pt-br' || normalized === 'pt' || normalized.startsWith('pt-')) {
    return 'pt-BR';
  }
  if (normalized === 'en' || normalized.startsWith('en-')) {
    return 'en';
  }
  return null;
}

export function resolveLocale(langParam?: string, acceptLanguage?: string): Locale {
  if (langParam) {
    const fromParam = parseLocaleCandidate(langParam);
    if (fromParam) {
      return fromParam;
    }
  }
  if (acceptLanguage) {
    const candidates = acceptLanguage.split(',').map((part) => part.split(';')[0] ?? '');
    for (const candidate of candidates) {
      const matched = parseLocaleCandidate(candidate);
      if (matched) {
        return matched;
      }
    }
  }
  return DEFAULT_LOCALE;
}

export function getErrorMessage(key: MessageKey, locale: Locale): string {
  return MESSAGE_CATALOGS[locale][key];
}
