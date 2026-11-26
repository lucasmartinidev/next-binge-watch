import type { MessageKey } from '../types/error';

export const EN_MESSAGES: Record<MessageKey, string> = {
  'search.queryRequired': 'Please enter a search term with at least 1 character.',
  'search.queryTooLong': 'Search term must be 100 characters or fewer.',
  'search.invalidType': 'Search type must be all, series, or person.',
  'common.invalidId': 'The provided ID must be a positive integer.',
  'series.notFound': 'Series not found.',
  'person.notFound': 'Person not found.',
  'watchlist.notFound': 'Series is not in your watchlist.',
  'watchlist.invalidStatus': 'Watch status must be want_to_watch, watching, or watched.',
  'watchlist.invalidEpisodeId': 'Episode ID must be a positive integer.',
  'watchlist.invalidSeasonNumber': 'Season number must be a non-negative integer.',
  'watchlist.invalidWatchedFlag': 'The watched flag must be a boolean.',
  'watchlist.episodeNotFound': 'Episode not found for this series.',
  'watchlist.seasonNotFound': 'Season not found for this series.',
  'preferences.invalidLocale': 'Language must be en or pt-BR.',
  'recommendations.invalidExcludeIds': 'Excluded IDs must be a comma-separated list of positive integers.',
  'upstream.rateLimited': 'Catalog service is temporarily busy. Please try again in a few seconds.',
  'upstream.unavailable': 'Catalog service is temporarily unavailable. Please try again later.',
  'upstream.timeout': 'Catalog service took too long to respond. Please try again.',
  'internal.error': 'An unexpected error occurred.',
};
