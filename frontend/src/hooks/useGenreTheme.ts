import { useContext, useEffect } from 'react';
import { GenreThemeContext } from '@/styles/genreThemeContextValue';
import type { GenreThemeId } from '@/types/theme';

export function usePageGenreTheme(theme: GenreThemeId): void {
  const context = useContext(GenreThemeContext);
  useEffect(() => {
    if (!context) {
      return;
    }
    context.setTheme(theme);
    return () => context.setTheme('default');
  }, [context, theme]);
}
