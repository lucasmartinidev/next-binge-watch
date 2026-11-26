import type { Locale } from '../types/locale';
import type { TvmazeAka } from '../types/tvmaze';

const PRIMARY_PT_COUNTRY = 'BR';
const FALLBACK_PT_COUNTRY = 'PT';

export function resolveLocalizedAka(akas: TvmazeAka[], locale: Locale): string | null {
  if (locale !== 'pt-BR') {
    return null;
  }
  const brazilian = akas.find((aka) => aka.country?.code?.toUpperCase() === PRIMARY_PT_COUNTRY);
  if (brazilian?.name) {
    return brazilian.name;
  }
  const portuguese = akas.find((aka) => aka.country?.code?.toUpperCase() === FALLBACK_PT_COUNTRY);
  return portuguese?.name || null;
}
