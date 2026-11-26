import type { Locale } from '../types/locale';
import type { EpisodePointer } from '../types/watchlist';

function padTwo(value: number): string {
  return String(value).padStart(2, '0');
}

export function formatContinueWatchingReason(locale: Locale, nextEpisode: EpisodePointer): string {
  const code = `S${padTwo(nextEpisode.season)}E${padTwo(nextEpisode.number)}`;
  return locale === 'pt-BR'
    ? `Continue de onde parou — próximo: ${code}`
    : `Continue where you left off — ${code} next`;
}

export function formatWantToWatchReason(locale: Locale): string {
  return locale === 'pt-BR'
    ? 'Melhor avaliação da sua lista Quero Assistir'
    : 'Top-rated pick from your Want to Watch list';
}

export function formatGenreDiscoveryReason(locale: Locale, genre: string): string {
  return locale === 'pt-BR'
    ? `Combina com seu interesse em ${genre}`
    : `Matches your interest in ${genre}`;
}

export function formatTopRatedReason(locale: Locale): string {
  return locale === 'pt-BR'
    ? 'Série bem avaliada para começar a assistir'
    : 'Top-rated series to start watching';
}
