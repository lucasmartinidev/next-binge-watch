import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CyberBackground } from '@/components/ds/CyberBackground';
import { HudPanel } from '@/components/ds/HudPanel';
import { NeonBadge } from '@/components/ds/NeonBadge';
import { NeonButton } from '@/components/ds/NeonButton';
import { usePageGenreTheme } from '@/hooks/useGenreTheme';
import { GenreThemeProvider } from './GenreThemeContext';
import { resolveGenreTheme } from './genreThemes';

function ThemeProbe({ theme }: { theme: 'sci-fi' | 'person' }) {
  usePageGenreTheme(theme);
  return <div>probe</div>;
}

describe('Design System genreThemes and primitives', () => {
  it('maps TVmaze genres and person entities to calibrated neon themes', () => {
    expect(resolveGenreTheme(['Science-Fiction'])).toBe('sci-fi');
    expect(resolveGenreTheme(['Crime', 'Thriller'])).toBe('crime-thriller');
    expect(resolveGenreTheme(['Drama'])).toBe('drama');
    expect(resolveGenreTheme(['Comedy'])).toBe('comedy');
    expect(resolveGenreTheme(['Horror'])).toBe('horror');
    expect(resolveGenreTheme(['Fantasy'])).toBe('fantasy');
    expect(resolveGenreTheme(['Action'])).toBe('action');
    expect(resolveGenreTheme(['Documentary'])).toBe('documentary');
    expect(resolveGenreTheme([], 'person')).toBe('person');
    expect(resolveGenreTheme([])).toBe('default');
  });

  it('updates documentElement data-genre-theme via GenreThemeProvider and resets when view unmounts', () => {
    const { rerender } = render(
      <GenreThemeProvider>
        <ThemeProbe theme="sci-fi" />
      </GenreThemeProvider>,
    );
    expect(document.documentElement.dataset.genreTheme).toBe('sci-fi');
    rerender(
      <GenreThemeProvider>
        <div>home</div>
      </GenreThemeProvider>,
    );
    expect(document.documentElement.dataset.genreTheme).toBe('default');
  });

  it('renders CyberBackground, HudPanel, NeonButton, and NeonBadge with genre scoping', () => {
    render(
      <>
        <CyberBackground />
        <HudPanel genreTheme="crime-thriller" as="section">
          <NeonBadge label="S01E01" variant="mono" genreTheme="crime-thriller" />
          <NeonButton variant="primary">Launch</NeonButton>
          <NeonButton variant="secondary">Inspect</NeonButton>
          <NeonButton variant="danger">Delete</NeonButton>
        </HudPanel>
      </>,
    );
    expect(screen.getByText('S01E01')).toHaveAttribute('data-genre-theme', 'crime-thriller');
    expect(screen.getByRole('button', { name: 'Launch' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });
});
