import { apiRequest } from './apiClient';
import type { Locale, UserPreferences } from '@/types/locale';

export function getPreferences(): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/api/preferences');
}

export function updatePreferences(locale: Locale): Promise<UserPreferences> {
  return apiRequest<UserPreferences>('/api/preferences', {
    method: 'PUT',
    locale,
    body: { locale },
  });
}
