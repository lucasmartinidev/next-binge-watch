import type { MessageKey } from '../types/error';

export const PT_BR_MESSAGES: Record<MessageKey, string> = {
  'search.queryRequired': 'Informe um termo de busca com pelo menos 1 caractere.',
  'search.queryTooLong': 'O termo de busca deve ter no máximo 100 caracteres.',
  'search.invalidType': 'O tipo de busca deve ser all, series ou person.',
  'common.invalidId': 'O ID informado deve ser um número inteiro positivo.',
  'series.notFound': 'Série não encontrada.',
  'person.notFound': 'Pessoa não encontrada.',
  'watchlist.notFound': 'Esta série não está na sua lista.',
  'watchlist.invalidStatus': 'O status deve ser want_to_watch, watching ou watched.',
  'watchlist.invalidEpisodeId': 'O ID do episódio deve ser um número inteiro positivo.',
  'watchlist.invalidSeasonNumber': 'O número da temporada deve ser um inteiro não negativo.',
  'watchlist.invalidWatchedFlag': 'O campo watched deve ser um booleano.',
  'watchlist.episodeNotFound': 'Episódio não encontrado para esta série.',
  'watchlist.seasonNotFound': 'Temporada não encontrada para esta série.',
  'preferences.invalidLocale': 'O idioma deve ser en ou pt-BR.',
  'recommendations.invalidExcludeIds': 'Os IDs excluídos devem ser uma lista de inteiros positivos separados por vírgula.',
  'upstream.rateLimited': 'O catálogo está temporariamente sobrecarregado. Tente novamente em alguns segundos.',
  'upstream.unavailable': 'O catálogo está temporariamente indisponível. Tente novamente mais tarde.',
  'upstream.timeout': 'O catálogo demorou para responder. Tente novamente.',
  'internal.error': 'Ocorreu um erro inesperado.',
};
