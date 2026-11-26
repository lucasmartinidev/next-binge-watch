import { describe, expect, it } from 'vitest';
import { getErrorMessage, resolveLocale } from './messages';
import { EN_MESSAGES } from './enMessages';
import { PT_BR_MESSAGES } from './ptBrMessages';
import type { MessageKey } from '../types/error';

describe('i18n messages (UT-09)', () => {
  it('resolves pt-BR from lang query parameter', () => {
    expect(resolveLocale('pt-BR', 'en-US')).toBe('pt-BR');
    expect(resolveLocale('pt', 'en-US')).toBe('pt-BR');
  });

  it('resolves en from lang query parameter', () => {
    expect(resolveLocale('en', 'pt-BR')).toBe('en');
    expect(resolveLocale('en-US', 'pt-BR')).toBe('en');
  });

  it('falls back to Accept-Language when lang param is omitted or unsupported', () => {
    expect(resolveLocale(undefined, 'pt-BR,pt;q=0.9,en;q=0.8')).toBe('pt-BR');
    expect(resolveLocale('fr-FR', 'pt-PT,en;q=0.5')).toBe('pt-BR');
    expect(resolveLocale(undefined, 'en-GB,en;q=0.9')).toBe('en');
  });

  it('defaults to en for unsupported locales', () => {
    expect(resolveLocale('fr-FR', 'de-DE,es-ES;q=0.8')).toBe('en');
    expect(resolveLocale(undefined, undefined)).toBe('en');
  });

  it('returns localized messages for every key in en and pt-BR', () => {
    const keys = Object.keys(EN_MESSAGES) as MessageKey[];
    expect(Object.keys(PT_BR_MESSAGES).sort()).toEqual([...keys].sort());
    for (const key of keys) {
      expect(getErrorMessage(key, 'en')).toBe(EN_MESSAGES[key]);
      expect(getErrorMessage(key, 'pt-BR')).toBe(PT_BR_MESSAGES[key]);
    }
  });
});
