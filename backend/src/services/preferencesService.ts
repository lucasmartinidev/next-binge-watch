import type { PreferencesRepository } from '../data/preferencesRepository';
import type { Locale } from '../types/locale';
import type { UserPreferences } from '../types/preferences';

export class PreferencesService {
  constructor(private readonly preferencesRepo: PreferencesRepository) {}

  async getPreferences(userId: string): Promise<UserPreferences> {
    return this.preferencesRepo.getPreferences(userId);
  }

  async updatePreferences(input: { userId: string; locale: Locale }): Promise<UserPreferences> {
    return this.preferencesRepo.setLocale(input.userId, input.locale);
  }
}
