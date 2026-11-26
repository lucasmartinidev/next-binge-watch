import { createContext } from 'react';
import type { GenreThemeId } from '@/types/theme';

export type GenreThemeContextValue = {
  theme: GenreThemeId;
  setTheme: (nextTheme: GenreThemeId) => void;
};

export const GenreThemeContext = createContext<GenreThemeContextValue | null>(null);
