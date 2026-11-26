import { describe, expect, it } from 'vitest';
import { resolveLocalizedAka } from './akaResolver';

describe('akaResolver (UT-02)', () => {
  const akas = [
    { name: 'Ruptura Total', country: { name: 'Portugal', code: 'PT' } },
    { name: 'Breaking Bad: A Química do Mal', country: { name: 'Brazil', code: 'BR' } },
  ];

  it('prefers BR AKA over PT AKA when locale is pt-BR', () => {
    expect(resolveLocalizedAka(akas, 'pt-BR')).toBe('Breaking Bad: A Química do Mal');
  });

  it('falls back to PT AKA when BR is absent', () => {
    expect(resolveLocalizedAka([akas[0]], 'pt-BR')).toBe('Ruptura Total');
  });

  it('returns null when locale is en or no BR/PT AKA exists', () => {
    expect(resolveLocalizedAka(akas, 'en')).toBeNull();
    expect(resolveLocalizedAka([{ name: 'Other', country: { code: 'ES' } }], 'pt-BR')).toBeNull();
  });
});
