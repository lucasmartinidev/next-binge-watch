import { describe, expect, it } from 'vitest';
import { detectBrowserLocale, mapBrowserLanguage } from './detectLocale';

describe('detectLocale (UT-10)', () => {
  it('maps pt-BR and pt variants to pt-BR', () => {
    expect(mapBrowserLanguage('pt-BR')).toBe('pt-BR');
    expect(mapBrowserLanguage('pt')).toBe('pt-BR');
    expect(mapBrowserLanguage('pt-PT')).toBe('pt-BR');
    expect(detectBrowserLocale(['pt-BR', 'en-US'])).toBe('pt-BR');
  });

  it('maps en variants to en and falls back to en for unsupported locales', () => {
    expect(mapBrowserLanguage('en-US')).toBe('en');
    expect(detectBrowserLocale(['fr-FR', 'de-DE'])).toBe('en');
    expect(detectBrowserLocale([])).toBe('en');
  });
});
