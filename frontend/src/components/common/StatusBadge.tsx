import { NeonBadge } from '@/components/ds/NeonBadge';
import type { GenreThemeId } from '@/types/theme';

type StatusBadgeProps = {
  label: string;
  tone?: 'default' | 'accent';
  genreTheme?: GenreThemeId;
};

export function StatusBadge({ label, tone = 'default', genreTheme }: StatusBadgeProps) {
  return <NeonBadge label={label} variant={tone === 'accent' ? 'accent' : 'neutral'} genreTheme={genreTheme} />;
}
