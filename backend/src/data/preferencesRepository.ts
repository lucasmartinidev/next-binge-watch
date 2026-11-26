import type { DatabaseClient } from './database';
import type { Locale } from '../types/locale';
import type { UserPreferences } from '../types/preferences';

const LOCALE_PREFERENCE_KEY = 'locale';

export class PreferencesRepository {
  constructor(private readonly db: DatabaseClient) {}

  async getPreferences(): Promise<UserPreferences> {
    const result = await this.db.execute({
      sql: 'SELECT value, updated_at FROM user_preferences WHERE key = ?',
      args: [LOCALE_PREFERENCE_KEY],
    });
    const row = result.rows[0];
    if (!row) {
      return { locale: null, updatedAt: null };
    }
    const value = String(row.value);
    const locale: Locale | null = value === 'pt-BR' || value === 'en' ? value : null;
    return {
      locale,
      updatedAt: String(row.updated_at),
    };
  }

  async setLocale(locale: Locale): Promise<UserPreferences> {
    const updatedAt = new Date().toISOString();
    await this.db.execute({
      sql: `INSERT INTO user_preferences (key, value, updated_at)
            VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET
              value = excluded.value,
              updated_at = excluded.updated_at`,
      args: [LOCALE_PREFERENCE_KEY, locale, updatedAt],
    });
    return { locale, updatedAt };
  }
}
