export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'UPSTREAM_RATE_LIMITED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_TIMEOUT'
  | 'INTERNAL_ERROR';

export type MessageKey =
  | 'search.queryRequired'
  | 'search.queryTooLong'
  | 'search.invalidType'
  | 'common.invalidId'
  | 'series.notFound'
  | 'person.notFound'
  | 'watchlist.notFound'
  | 'watchlist.invalidStatus'
  | 'watchlist.invalidEpisodeId'
  | 'watchlist.invalidSeasonNumber'
  | 'watchlist.invalidWatchedFlag'
  | 'watchlist.episodeNotFound'
  | 'watchlist.seasonNotFound'
  | 'lists.notFound'
  | 'lists.invalidEntityType'
  | 'lists.invalidName'
  | 'lists.nameTaken'
  | 'lists.descriptionTooLong'
  | 'lists.invalidIcon'
  | 'lists.invalidColor'
  | 'lists.invalidTags'
  | 'lists.tooManyTags'
  | 'lists.tagTooLong'
  | 'lists.primaryProtected'
  | 'lists.entityTypeImmutable'
  | 'lists.crossTypeNotAllowed'
  | 'lists.invalidListIds'
  | 'lists.itemNotFound'
  | 'preferences.invalidLocale'
  | 'recommendations.invalidExcludeIds'
  | 'auth.unauthorized'
  | 'auth.invalidCredentials'
  | 'auth.accountDeactivated'
  | 'auth.identifierRequired'
  | 'auth.invalidPasswordHash'
  | 'auth.invalidCurrentPassword'
  | 'auth.passwordUnchanged'
  | 'auth.forbidden'
  | 'auth.devModeDisabled'
  | 'users.notFound'
  | 'users.invalidUsername'
  | 'users.invalidEmail'
  | 'users.invalidRole'
  | 'users.usernameTaken'
  | 'users.emailTaken'
  | 'users.cannotModifySelf'
  | 'users.lastAdminProtected'
  | 'users.invalidUpdate'
  | 'upstream.rateLimited'
  | 'upstream.unavailable'
  | 'upstream.timeout'
  | 'internal.error';

export type ApiErrorResponse = {
  error: {
    code: ErrorCode;
    message: string;
  };
};

const ERROR_STATUS_BY_CODE: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UPSTREAM_RATE_LIMITED: 429,
  UPSTREAM_UNAVAILABLE: 502,
  UPSTREAM_TIMEOUT: 504,
  INTERNAL_ERROR: 500,
};

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(
    public readonly code: ErrorCode,
    public readonly messageKey: MessageKey,
    options?: { cause?: unknown },
  ) {
    super(messageKey, options);
    this.name = 'AppError';
    this.statusCode = ERROR_STATUS_BY_CODE[code];
  }
}
