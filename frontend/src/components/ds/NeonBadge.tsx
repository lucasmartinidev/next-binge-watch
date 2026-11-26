import type { GenreThemeId } from '@/types/theme';

type NeonBadgeProps = {
  label: string;
  variant?: 'accent' | 'neutral' | 'mono';
  genreTheme?: GenreThemeId;
};

const BADGE_STYLES = {
  accent: 'border border-ds-accent/50 bg-ds-accent/15 text-ds-accent font-semibold',
  neutral: 'border border-ds-border bg-ds-elevated/80 text-ds-text font-medium',
  mono: 'border border-ds-accent/40 bg-ds-elevated text-ds-accent font-mono',
};

export function NeonBadge({ label, variant = 'neutral', genreTheme }: NeonBadgeProps) {
  return (
    <span data-genre-theme={genreTheme} className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs ${BADGE_STYLES[variant]}`}>
      {label}
    </span>
  );
}
