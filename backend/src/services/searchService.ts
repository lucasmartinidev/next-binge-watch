import type { TvmazeClient } from '../data/tvmazeClient';
import type { WatchlistRepository } from '../data/watchlistRepository';
import type { ListBadgeSummary } from '../types/list';
import type { Locale } from '../types/locale';
import type { SearchResponse, SearchResultItem, SearchScope } from '../types/search';
import type { TvmazePersonSearchResult, TvmazeShowSearchResult } from '../types/tvmaze';
import type { ListMembershipService } from './listMembershipService';

type ScoredResult = { score: number; item: SearchResultItem };

function mapShowResult(entry: TvmazeShowSearchResult, akaBySeriesId: Map<number, string>): ScoredResult {
  const { show } = entry;
  const premieredYear = show.premiered ? show.premiered.slice(0, 4) : null;
  const parts = [show.type, premieredYear].filter(Boolean);
  return {
    score: entry.score,
    item: {
      id: show.id, contentType: 'series', name: show.name,
      localizedName: akaBySeriesId.get(show.id) ?? null,
      imageUrl: show.image?.medium ?? show.image?.original ?? null,
      subtitle: parts.length > 0 ? parts.join(' · ') : null,
      status: show.status ?? null, rating: show.rating?.average ?? null,
      premieredYear, genres: show.genres ?? [], tvmazeUrl: show.url, lists: [],
    },
  };
}

function mapPersonResult(entry: TvmazePersonSearchResult): ScoredResult {
  const { person } = entry;
  return {
    score: entry.score,
    item: {
      id: person.id, contentType: 'person', name: person.name, localizedName: null,
      imageUrl: person.image?.medium ?? person.image?.original ?? null,
      subtitle: person.country?.name ?? null,
      status: null, rating: null, premieredYear: null, genres: [], tvmazeUrl: person.url, lists: [],
    },
  };
}

export class SearchService {
  constructor(
    private readonly tvmaze: TvmazeClient,
    private readonly watchlistRepo: WatchlistRepository,
    private readonly membershipService?: ListMembershipService,
  ) {}

  async search(input: { query: string; type: SearchScope; locale: Locale; userId?: string }): Promise<SearchResponse> {
    const includeSeries = input.type === 'all' || input.type === 'series';
    const includePeople = input.type === 'all' || input.type === 'person';
    const [shows, people, akaBySeriesId] = await Promise.all([
      includeSeries ? this.tvmaze.searchShows(input.query) : Promise.resolve([]),
      includePeople ? this.tvmaze.searchPeople(input.query) : Promise.resolve([]),
      input.locale === 'pt-BR' && includeSeries && input.userId ? this.loadSavedAkas(input.userId) : Promise.resolve(new Map()),
    ]);
    const combined: ScoredResult[] = [
      ...shows.map((entry) => mapShowResult(entry, akaBySeriesId)),
      ...people.map((entry) => mapPersonResult(entry)),
    ];
    const sorted = [...combined].sort((a, b) => b.score - a.score).map((entry) => entry.item);
    const items = await this.hydrateBadges(sorted, input.locale, input.userId);
    return { query: input.query, type: input.type, locale: input.locale, total: items.length, items };
  }

  private async hydrateBadges(items: SearchResultItem[], locale: Locale, userId?: string): Promise<SearchResultItem[]> {
    if (!this.membershipService || !userId || items.length === 0) return items;
    const seriesIds = items.filter((i) => i.contentType === 'series').map((i) => i.id);
    const personIds = items.filter((i) => i.contentType === 'person').map((i) => i.id);
    const [seriesMap, personMap]: [Map<number, ListBadgeSummary[]>, Map<number, ListBadgeSummary[]>] = await Promise.all([
      this.membershipService.getSeriesBadgesMap(userId, seriesIds, locale),
      this.membershipService.getPersonBadgesMap(userId, personIds),
    ]);
    return items.map((item) => ({
      ...item,
      lists: (item.contentType === 'series' ? seriesMap.get(item.id) : personMap.get(item.id)) ?? [],
    }));
  }

  private async loadSavedAkas(userId: string): Promise<Map<number, string>> {
    const saved = await this.watchlistRepo.listAll(userId);
    const map = new Map<number, string>();
    for (const row of saved) {
      if (row.localizedNamePtBr) map.set(row.seriesId, row.localizedNamePtBr);
    }
    return map;
  }
}
