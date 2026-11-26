export type Locale = 'en' | 'pt-BR';

export const DEFAULT_LOCALE: Locale = 'en';

export type UserPreferences = {
  locale: Locale | null;
  updatedAt: string | null;
};
