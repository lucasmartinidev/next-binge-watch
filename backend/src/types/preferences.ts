import type { Locale } from './locale';

export type UserPreferences = {
  locale: Locale | null;
  updatedAt: string | null;
};
