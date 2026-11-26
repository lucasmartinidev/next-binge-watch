export type PersonSeriesCredit = {
  seriesId: number;
  seriesName: string;
  imageUrl: string | null;
  premieredYear: string | null;
  role: string;
  creditType: 'cast' | 'crew';
};

export type PersonProfile = {
  id: number;
  name: string;
  imageUrl: string | null;
  country: string | null;
  birthday: string | null;
  deathday: string | null;
  gender: string | null;
  tvmazeUrl: string;
  castCredits: PersonSeriesCredit[] | null;
  crewCredits: PersonSeriesCredit[] | null;
  partialData: boolean;
};
