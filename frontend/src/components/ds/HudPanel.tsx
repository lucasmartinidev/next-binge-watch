import type { ReactNode } from 'react';
import type { GenreThemeId } from '@/types/theme';

type HudPanelProps = {
  children: ReactNode;
  genreTheme?: GenreThemeId;
  className?: string;
  as?: 'div' | 'section' | 'article';
};

export function HudPanel({ children, genreTheme, className = '', as = 'div' }: HudPanelProps) {
  const Tag = as;
  return (
    <Tag data-genre-theme={genreTheme} className={`ds-hud-panel rounded-hud backdrop-blur-md ${className}`}>
      {children}
    </Tag>
  );
}
