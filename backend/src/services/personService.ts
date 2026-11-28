import { logger } from '../config/logger';
import type { TvmazeClient } from '../data/tvmazeClient';
import { AppError } from '../types/error';
import type { ListBadgeSummary } from '../types/list';
import type { Locale } from '../types/locale';
import type { PersonProfile, PersonSeriesCredit } from '../types/person';
import type { TvmazeCastCredit, TvmazeCrewCredit, TvmazeShow } from '../types/tvmaze';
import type { ListMembershipService } from './listMembershipService';

function buildCredit(show: TvmazeShow, role: string, creditType: 'cast' | 'crew'): PersonSeriesCredit {
  return {
    seriesId: show.id, seriesName: show.name,
    imageUrl: show.image?.medium ?? show.image?.original ?? null,
    premieredYear: show.premiered ? show.premiered.slice(0, 4) : null,
    role, creditType, lists: [],
  };
}

function mapCastCredits(credits: TvmazeCastCredit[]): PersonSeriesCredit[] {
  const results: PersonSeriesCredit[] = [];
  for (const credit of credits) {
    const show = credit._embedded?.show;
    if (show) results.push(buildCredit(show, credit._embedded?.character?.name ?? '', 'cast'));
  }
  return results;
}

function mapCrewCredits(credits: TvmazeCrewCredit[]): PersonSeriesCredit[] {
  const results: PersonSeriesCredit[] = [];
  for (const credit of credits) {
    const show = credit._embedded?.show;
    if (show) results.push(buildCredit(show, credit.type, 'crew'));
  }
  return results;
}

function attachSeriesBadges(credits: PersonSeriesCredit[] | null, map: Map<number, ListBadgeSummary[]>): PersonSeriesCredit[] | null {
  return credits ? credits.map((credit) => ({ ...credit, lists: map.get(credit.seriesId) ?? [] })) : null;
}

export class PersonService {
  constructor(private readonly tvmaze: TvmazeClient, private readonly membershipService?: ListMembershipService) {}

  async getPersonProfile(id: number, locale: Locale = 'en'): Promise<PersonProfile> {
    const person = await this.tvmaze.getPerson(id);
    if (!person) throw new AppError('NOT_FOUND', 'person.notFound');
    const [castResult, crewResult] = await Promise.all([this.safeLoadCastCredits(id), this.safeLoadCrewCredits(id)]);
    const rawCast = castResult.credits ? mapCastCredits(castResult.credits) : null;
    const rawCrew = crewResult.credits ? mapCrewCredits(crewResult.credits) : null;
    const [personBadges, creditBadges] = await this.loadBadges({ personId: id, cast: rawCast, crew: rawCrew, locale });
    return {
      id: person.id, name: person.name,
      imageUrl: person.image?.original ?? person.image?.medium ?? null,
      country: person.country?.name ?? null, birthday: person.birthday ?? null,
      deathday: person.deathday ?? null, gender: person.gender ?? null, tvmazeUrl: person.url,
      lists: personBadges.get(id) ?? [],
      castCredits: attachSeriesBadges(rawCast, creditBadges),
      crewCredits: attachSeriesBadges(rawCrew, creditBadges),
      partialData: castResult.failed || crewResult.failed,
    };
  }

  private async loadBadges(input: {
    personId: number; cast: PersonSeriesCredit[] | null; crew: PersonSeriesCredit[] | null; locale: Locale;
  }): Promise<[Map<number, ListBadgeSummary[]>, Map<number, ListBadgeSummary[]>]> {
    if (!this.membershipService) return [new Map(), new Map()];
    const seriesIds = [...new Set([...(input.cast ?? []), ...(input.crew ?? [])].map((c) => c.seriesId))];
    return Promise.all([
      this.membershipService.getPersonBadgesMap([input.personId]),
      this.membershipService.getSeriesBadgesMap(seriesIds, input.locale),
    ]);
  }

  private async safeLoadCastCredits(id: number): Promise<{ credits: TvmazeCastCredit[] | null; failed: boolean }> {
    try {
      return { credits: await this.tvmaze.getPersonCastCredits(id), failed: false };
    } catch (error: unknown) {
      logger.warn('Failed to load person cast credits', { personId: id, error: String(error) });
      return { credits: null, failed: true };
    }
  }

  private async safeLoadCrewCredits(id: number): Promise<{ credits: TvmazeCrewCredit[] | null; failed: boolean }> {
    try {
      return { credits: await this.tvmaze.getPersonCrewCredits(id), failed: false };
    } catch (error: unknown) {
      logger.warn('Failed to load person crew credits', { personId: id, error: String(error) });
      return { credits: null, failed: true };
    }
  }
}
