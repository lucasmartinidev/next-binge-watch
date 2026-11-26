import { logger } from '../config/logger';
import type { TvmazeClient } from '../data/tvmazeClient';
import { AppError } from '../types/error';
import type { PersonProfile, PersonSeriesCredit } from '../types/person';
import type { TvmazeCastCredit, TvmazeCrewCredit, TvmazeShow } from '../types/tvmaze';

function buildCredit(show: TvmazeShow, role: string, creditType: 'cast' | 'crew'): PersonSeriesCredit {
  return {
    seriesId: show.id,
    seriesName: show.name,
    imageUrl: show.image?.medium ?? show.image?.original ?? null,
    premieredYear: show.premiered ? show.premiered.slice(0, 4) : null,
    role,
    creditType,
  };
}

function mapCastCredits(credits: TvmazeCastCredit[]): PersonSeriesCredit[] {
  const results: PersonSeriesCredit[] = [];
  for (const credit of credits) {
    const show = credit._embedded?.show;
    if (show) {
      results.push(buildCredit(show, credit._embedded?.character?.name ?? '', 'cast'));
    }
  }
  return results;
}

function mapCrewCredits(credits: TvmazeCrewCredit[]): PersonSeriesCredit[] {
  const results: PersonSeriesCredit[] = [];
  for (const credit of credits) {
    const show = credit._embedded?.show;
    if (show) {
      results.push(buildCredit(show, credit.type, 'crew'));
    }
  }
  return results;
}

export class PersonService {
  constructor(private readonly tvmaze: TvmazeClient) {}

  async getPersonProfile(id: number): Promise<PersonProfile> {
    const person = await this.tvmaze.getPerson(id);
    if (!person) {
      throw new AppError('NOT_FOUND', 'person.notFound');
    }
    const [castResult, crewResult] = await Promise.all([
      this.safeLoadCastCredits(id),
      this.safeLoadCrewCredits(id),
    ]);
    return {
      id: person.id,
      name: person.name,
      imageUrl: person.image?.original ?? person.image?.medium ?? null,
      country: person.country?.name ?? null,
      birthday: person.birthday ?? null,
      deathday: person.deathday ?? null,
      gender: person.gender ?? null,
      tvmazeUrl: person.url,
      castCredits: castResult.credits ? mapCastCredits(castResult.credits) : null,
      crewCredits: crewResult.credits ? mapCrewCredits(crewResult.credits) : null,
      partialData: castResult.failed || crewResult.failed,
    };
  }

  private async safeLoadCastCredits(
    id: number,
  ): Promise<{ credits: TvmazeCastCredit[] | null; failed: boolean }> {
    try {
      return { credits: await this.tvmaze.getPersonCastCredits(id), failed: false };
    } catch (error: unknown) {
      logger.warn('Failed to load person cast credits', { personId: id, error: String(error) });
      return { credits: null, failed: true };
    }
  }

  private async safeLoadCrewCredits(
    id: number,
  ): Promise<{ credits: TvmazeCrewCredit[] | null; failed: boolean }> {
    try {
      return { credits: await this.tvmaze.getPersonCrewCredits(id), failed: false };
    } catch (error: unknown) {
      logger.warn('Failed to load person crew credits', { personId: id, error: String(error) });
      return { credits: null, failed: true };
    }
  }
}
