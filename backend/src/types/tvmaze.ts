export type TvmazeImage = {
  medium?: string | null;
  original?: string | null;
};

export type TvmazeCountry = {
  name?: string | null;
  code?: string | null;
};

export type TvmazeNetwork = {
  name?: string | null;
};

export type TvmazeEpisode = {
  id: number;
  name: string;
  season: number;
  number: number | null;
  airdate?: string | null;
  summary?: string | null;
};

export type TvmazePerson = {
  id: number;
  url: string;
  name: string;
  country?: TvmazeCountry | null;
  birthday?: string | null;
  deathday?: string | null;
  gender?: string | null;
  image?: TvmazeImage | null;
};

export type TvmazeCharacter = {
  id: number;
  name: string;
};

export type TvmazeCastMember = {
  person: TvmazePerson;
  character: TvmazeCharacter;
};

export type TvmazeCrewMember = {
  type: string;
  person: TvmazePerson;
};

export type TvmazeAka = {
  name: string;
  country?: TvmazeCountry | null;
};

export type TvmazeShow = {
  id: number;
  url: string;
  name: string;
  type?: string | null;
  genres?: string[];
  status?: string | null;
  premiered?: string | null;
  ended?: string | null;
  rating?: { average?: number | null } | null;
  network?: TvmazeNetwork | null;
  webChannel?: TvmazeNetwork | null;
  image?: TvmazeImage | null;
  summary?: string | null;
  _embedded?: {
    episodes?: TvmazeEpisode[];
    cast?: TvmazeCastMember[];
  };
};

export type TvmazeShowSearchResult = {
  score: number;
  show: TvmazeShow;
};

export type TvmazePersonSearchResult = {
  score: number;
  person: TvmazePerson;
};

export type TvmazeCastCredit = {
  _embedded?: {
    show?: TvmazeShow;
    character?: TvmazeCharacter;
  };
};

export type TvmazeCrewCredit = {
  type: string;
  _embedded?: {
    show?: TvmazeShow;
  };
};
