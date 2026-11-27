import type { Locale } from '../types/locale';
import type { UserPreferences } from '../types/preferences';
import type { DatabaseClient } from './database';
import { toIsoTimestamp } from './watchlistRowMapper';

const LOCALE_PREFERENCE_KEY = 'locale';

export class PreferencesRepository {
  constructor(private readonly db: DatabaseClient) {}

  async getPreferences(): Promise<UserPreferences> {
    const result = await this.db.query(
      'SELECT value, updated_at FROM user_preferences WHERE key = $1',
      [LOCALE_PREFERENCE_KEY],
    );
    const row = result.rows[0];
    if (!row) {
      return { locale: null, updatedAt: null };
    }
    const value = String(row.value);
    const locale: Locale | null = value === 'pt-BR' || value === 'en' ? value : null;
    return {
      locale,
      updatedAt: toIsoTimestamp(row.updated_at),
    };
  }

  async setLocale(locale: Locale): Promise<UserPreferences> {
    const updatedAt = new Date().toISOString();
    await this.db.query(
      `INSERT INTO user_preferences (key, value, updated_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = EXCLUDED.updated_at`,
      [LOCALE_PREFERENCE_KEY, locale, updatedAt],
    );
    return { locale, updatedAt };
  }
}
