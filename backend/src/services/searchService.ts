import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchlistRepository } from '../data/watchlistRepository';
import type { Locale } from '../types/locale';
import type { SearchResponse, SearchResultItem, SearchScope } from '../types/search';
import type { TvmazePersonSearchResult, TvmazeShowSearchResult } from '../types/tvmaze';

type ScoredResult = {
  score: number;
  item: SearchResultItem;
};

function mapShowResult(
  entry: TvmazeShowSearchResult,
  akaBySeriesId: Map<number, string>,
): ScoredResult {
  const { show } = entry;
  const premieredYear = show.premiered ? show.premiered.slice(0, 4) : null;
  const parts = [show.type, premieredYear].filter(Boolean);
  return {
    score: entry.score,
    item: {
      id: show.id,
      contentType: 'series',
      name: show.name,
      localizedName: akaBySeriesId.get(show.id) ?? null,
      imageUrl: show.image?.medium ?? show.image?.original ?? null,
      subtitle: parts.length > 0 ? parts.join(' · ') : null,
      status: show.status ?? null,
      rating: show.rating?.average ?? null,
      premieredYear,
      genres: show.genres ?? [],
      tvmazeUrl: show.url,
    },
  };
}

function mapPersonResult(entry: TvmazePersonSearchResult): ScoredResult {
  const { person } = entry;
  return {
    score: entry.score,
    item: {
      id: person.id,
      contentType: 'person',
      name: person.name,
      localizedName: null,
      imageUrl: person.image?.medium ?? person.image?.original ?? null,
      subtitle: person.country?.name ?? null,
      status: null,
      rating: null,
      premieredYear: null,
      genres: [],
      tvmazeUrl: person.url,
    },
  };
}

export class SearchService {
  constructor(
    private readonly tvmaze: TvmazeClient,
    private readonly watchlistRepo: WatchlistRepository,
  ) {}

  async search(input: { query: string; type: SearchScope; locale: Locale }): Promise<SearchResponse> {
    const includeSeries = input.type === 'all' || input.type === 'series';
    const includePeople = input.type === 'all' || input.type === 'person';
    const [shows, people, akaBySeriesId] = await Promise.all([
      includeSeries ? this.tvmaze.searchShows(input.query) : Promise.resolve([]),
      includePeople ? this.tvmaze.searchPeople(input.query) : Promise.resolve([]),
      input.locale === 'pt-BR' && includeSeries ? this.loadSavedAkas() : Promise.resolve(new Map()),
    ]);
    const combined: ScoredResult[] = [
      ...shows.map((entry) => mapShowResult(entry, akaBySeriesId)),
      ...people.map((entry) => mapPersonResult(entry)),
    ];
    const items = [...combined]
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
    return { query: input.query, type: input.type, locale: input.locale, total: items.length, items };
  }

  private async loadSavedAkas(): Promise<Map<number, string>> {
    const saved = await this.watchlistRepo.listAll();
    const map = new Map<number, string>();
    for (const row of saved) {
      if (row.localizedNamePtBr) {
        map.set(row.seriesId, row.localizedNamePtBr);
      }
    }
    return map;
  }
}
