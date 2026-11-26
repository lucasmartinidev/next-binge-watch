import { useEffect, useState, type ReactNode } from 'react';
import type { GenreThemeId } from '@/types/theme';
import { GenreThemeContext } from './genreThemeContextValue';

export function GenreThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<GenreThemeId>('default');
  useEffect(() => {
    document.documentElement.dataset.genreTheme = theme;
  }, [theme]);
  return (
    <GenreThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </GenreThemeContext.Provider>
  );
}
