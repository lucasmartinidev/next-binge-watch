import type { PreferencesRepository } from '../data/preferencesRepository';
import type { Locale } from '../types/locale';
import type { UserPreferences } from '../types/preferences';

export class PreferencesService {
  constructor(private readonly preferencesRepo: PreferencesRepository) {}

  async getPreferences(): Promise<UserPreferences> {
    return this.preferencesRepo.getPreferences();
  }

  async updatePreferences(input: { locale: Locale }): Promise<UserPreferences> {
    return this.preferencesRepo.setLocale(input.locale);
  }
}
