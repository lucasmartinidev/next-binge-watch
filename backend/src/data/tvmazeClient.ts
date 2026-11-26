import type {
  TvmazeAka,
  TvmazeCastCredit,
  TvmazeCrewCredit,
  TvmazeCrewMember,
  TvmazePerson,
  TvmazePersonSearchResult,
  TvmazeShow,
  TvmazeShowSearchResult,
} from '../types/tvmaze';
import { TvmazeHttp, type TvmazeHttpOptions } from './tvmazeHttp';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
const THIRTY_MINUTES_MS = 30 * 60 * 1000;

export class TvmazeClient {
  private readonly http: TvmazeHttp;

  constructor(options: TvmazeHttpOptions) {
    this.http = new TvmazeHttp(options);
  }

  async searchShows(query: string): Promise<TvmazeShowSearchResult[]> {
    const encoded = encodeURIComponent(query);
    const data = await this.http.getJson<TvmazeShowSearchResult[]>(
      `/search/shows?q=${encoded}`,
      FIVE_MINUTES_MS,
    );
    return Array.isArray(data) ? data : [];
  }

  async searchPeople(query: string): Promise<TvmazePersonSearchResult[]> {
    const encoded = encodeURIComponent(query);
    const data = await this.http.getJson<TvmazePersonSearchResult[]>(
      `/search/people?q=${encoded}`,
      FIVE_MINUTES_MS,
    );
    return Array.isArray(data) ? data : [];
  }

  async getShowWithEmbeds(id: number): Promise<TvmazeShow | null> {
    return this.http.getJson<TvmazeShow>(
      `/shows/${id}?embed[]=episodes&embed[]=cast`,
      FIVE_MINUTES_MS,
      true,
    );
  }

  async getShowCrew(id: number): Promise<TvmazeCrewMember[]> {
    const data = await this.http.getJson<TvmazeCrewMember[]>(
      `/shows/${id}/crew`,
      FIVE_MINUTES_MS,
      true,
    );
    return Array.isArray(data) ? data : [];
  }

  async getShowAkas(id: number): Promise<TvmazeAka[]> {
    const data = await this.http.getJson<TvmazeAka[]>(
      `/shows/${id}/akas`,
      FIVE_MINUTES_MS,
      true,
    );
    return Array.isArray(data) ? data : [];
  }

  async getPerson(id: number): Promise<TvmazePerson | null> {
    return this.http.getJson<TvmazePerson>(`/people/${id}`, FIVE_MINUTES_MS, true);
  }

  async getPersonCastCredits(id: number): Promise<TvmazeCastCredit[]> {
    const data = await this.http.getJson<TvmazeCastCredit[]>(
      `/people/${id}/castcredits?embed[]=show&embed[]=character`,
      FIVE_MINUTES_MS,
      true,
    );
    return Array.isArray(data) ? data : [];
  }

  async getPersonCrewCredits(id: number): Promise<TvmazeCrewCredit[]> {
    const data = await this.http.getJson<TvmazeCrewCredit[]>(
      `/people/${id}/crewcredits?embed=show`,
      FIVE_MINUTES_MS,
      true,
    );
    return Array.isArray(data) ? data : [];
  }

  async getShowsPage(page: number): Promise<TvmazeShow[]> {
    const data = await this.http.getJson<TvmazeShow[]>(
      `/shows?page=${page}`,
      THIRTY_MINUTES_MS,
      true,
    );
    return Array.isArray(data) ? data : [];
  }
}
