import type { Locale } from '../types/locale';
import type { UserPreferences } from '../types/preferences';
import type { DatabaseClient } from './database';
import { toIsoTimestamp } from './watchlistRowMapper';

const LOCALE_PREFERENCE_KEY = 'locale';

export class PreferencesRepository {
  constructor(private readonly db: DatabaseClient) {}

  async getPreferences(userId: string): Promise<UserPreferences> {
    const result = await this.db.query(
      'SELECT value, updated_at FROM user_preferences WHERE user_id = $1 AND key = $2',
      [userId, LOCALE_PREFERENCE_KEY],
    );
    const row = result.rows[0];
    if (!row) {
      return { locale: null, updatedAt: null };
    }
    const value = String(row.value);
    const locale: Locale | null = value === 'pt-BR' || value === 'en' ? value : null;
    return { locale, updatedAt: toIsoTimestamp(row.updated_at) };
  }

  async setLocale(userId: string, locale: Locale): Promise<UserPreferences> {
    const updatedAt = new Date().toISOString();
    await this.db.query(
      `INSERT INTO user_preferences (user_id, key, value, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, key) DO UPDATE SET
         value = EXCLUDED.value,
         updated_at = EXCLUDED.updated_at`,
      [userId, LOCALE_PREFERENCE_KEY, locale, updatedAt],
    );
    return { locale, updatedAt };
  }
}
