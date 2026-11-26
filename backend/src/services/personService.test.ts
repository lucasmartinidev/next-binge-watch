import { describe, expect, it, vi } from 'vitest';
import type { TvmazeClient } from '../data/tvmazeClient';
import { PersonService } from './personService';

describe('PersonService (UT-05)', () => {
  const samplePerson = {
    id: 14229,
    url: 'https://www.tvmaze.com/people/14229/bryan-cranston',
    name: 'Bryan Cranston',
    country: { name: 'United States' },
    birthday: '1956-03-07',
    deathday: null,
    gender: 'Male',
    image: { original: 'https://img.example/bc.jpg' },
  };

  it('separates cast and crew credits and degrades gracefully if crewcredits fail', async () => {
    const tvmaze = {
      getPerson: vi.fn().mockResolvedValue(samplePerson),
      getPersonCastCredits: vi.fn().mockResolvedValue([
        {
          _embedded: {
            show: { id: 169, name: 'Breaking Bad', premiered: '2008-01-20', url: 'https://tvmaze.com/s/169' },
            character: { id: 1, name: 'Walter White' },
          },
        },
      ]),
      getPersonCrewCredits: vi.fn().mockRejectedValue(new Error('crew timeout')),
    } as unknown as TvmazeClient;
    const service = new PersonService(tvmaze);
    const profile = await service.getPersonProfile(14229);
    expect(profile.castCredits).toHaveLength(1);
    expect(profile.castCredits?.[0]).toMatchObject({
      seriesId: 169,
      role: 'Walter White',
      creditType: 'cast',
    });
    expect(profile.crewCredits).toBeNull();
    expect(profile.partialData).toBe(true);
  });

  it('throws NOT_FOUND when person does not exist', async () => {
    const tvmaze = { getPerson: vi.fn().mockResolvedValue(null) } as unknown as TvmazeClient;
    const service = new PersonService(tvmaze);
    await expect(service.getPersonProfile(999999)).rejects.toMatchObject({
      code: 'NOT_FOUND',
      statusCode: 404,
    });
  });
});
