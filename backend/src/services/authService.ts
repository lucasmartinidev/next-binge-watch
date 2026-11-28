import { randomBytes, randomUUID } from 'node:crypto';
import { logger } from '../config/logger';
import { hashSessionToken, type CreateSessionInput } from '../data/sessionRepository';
import { toPublicUser } from '../data/userRowMapper';
import type { ActiveSessionContext, AuthChallengeResponse, AuthSessionResult, AuthUser, ChangePasswordServiceInput, LoginInput } from '../types/auth';
import { AppError } from '../types/error';
import type { StoredUser } from '../types/user';
import type { PasswordService } from './passwordService';
import { validateIdentifier, validateUuid } from './userValidation';

const MS_PER_DAY = 86_400_000;
const TOKEN_BYTES = 32;

export type AuthUserStore = {
  findById(userId: string): Promise<StoredUser | null>; findByIdentifier(normalizedIdentifier: string): Promise<StoredUser | null>;
  listAll(): Promise<StoredUser[]>; updateCredentials(userId: string, creds: { clientSalt: string; passwordHash: string }): Promise<boolean>;
};
export type AuthSessionStore = {
  create(input: CreateSessionInput): Promise<unknown>; findActiveByTokenHash(tokenHash: string, nowIso: string): Promise<ActiveSessionContext | null>;
  deleteById(sessionId: string): Promise<void>; deleteOtherUserSessions(userId: string, keepSessionId: string): Promise<void>;
};

export type AuthServiceDeps = { userRepo: AuthUserStore; sessionRepo: AuthSessionStore; passwordService: PasswordService; sessionTtlDays: number };

export class AuthService {
  constructor(private readonly deps: AuthServiceDeps) {}

  async issueChallenge(rawIdentifier: string): Promise<AuthChallengeResponse> {
    const identifier = validateIdentifier(rawIdentifier);
    const user = await this.deps.userRepo.findByIdentifier(identifier);
    return { salt: user?.isActive ? user.clientSalt : this.deps.passwordService.deriveFakeClientSalt(identifier) };
  }

  async login(input: LoginInput): Promise<AuthSessionResult> {
    const identifier = validateIdentifier(input.identifier);
    const clientHash = this.deps.passwordService.validateClientHash(input.passwordHash);
    const user = await this.deps.userRepo.findByIdentifier(identifier);
    const matches = await this.deps.passwordService.verifyClientHash(clientHash, user?.passwordHash ?? null);
    if (!user || !matches) {
      logger.warn('Failed login attempt');
      throw new AppError('UNAUTHORIZED', 'auth.invalidCredentials');
    }
    if (!user.isActive) {
      logger.warn('Deactivated user login attempt', { userId: user.id });
      throw new AppError('UNAUTHORIZED', 'auth.accountDeactivated');
    }
    logger.info('User signed in', { userId: user.id, role: user.role, mode: 'standard' });
    return this.createSessionForUser(user);
  }

  async logout(sessionId: string | null): Promise<void> {
    if (sessionId) await this.deps.sessionRepo.deleteById(sessionId);
  }

  async getSessionByToken(rawToken: string | null): Promise<ActiveSessionContext | null> {
    return rawToken ? this.deps.sessionRepo.findActiveByTokenHash(hashSessionToken(rawToken), new Date().toISOString()) : null;
  }

  async getPasswordChallenge(userId: string): Promise<AuthChallengeResponse> {
    const user = await this.deps.userRepo.findById(userId);
    if (!user || !user.isActive) throw new AppError('UNAUTHORIZED', 'auth.unauthorized');
    return { salt: user.clientSalt };
  }

  async changePassword(input: ChangePasswordServiceInput): Promise<void> {
    const user = await this.deps.userRepo.findById(input.userId);
    if (!user || !user.isActive) throw new AppError('UNAUTHORIZED', 'auth.unauthorized');
    const currentHash = this.deps.passwordService.validateClientHash(input.currentPasswordHash);
    const newSalt = this.deps.passwordService.validateClientSalt(input.newClientSalt);
    const newHash = this.deps.passwordService.validateClientHash(input.newPasswordHash, newSalt);
    if (!(await this.deps.passwordService.verifyClientHash(currentHash, user.passwordHash))) throw new AppError('UNAUTHORIZED', 'auth.invalidCurrentPassword');
    if (await this.deps.passwordService.verifyClientHash(newHash, user.passwordHash)) throw new AppError('VALIDATION_ERROR', 'auth.passwordUnchanged');
    const storedHash = await this.deps.passwordService.hashClientHashForStorage(newHash);
    await this.deps.userRepo.updateCredentials(user.id, { clientSalt: newSalt, passwordHash: storedHash });
    await this.deps.sessionRepo.deleteOtherUserSessions(user.id, input.sessionId);
    logger.info('User password changed', { userId: user.id });
  }

  async listDevUsers(): Promise<AuthUser[]> {
    return (await this.deps.userRepo.listAll()).map(toPublicUser);
  }

  async loginAsDevUser(rawUserId: string): Promise<AuthSessionResult> {
    const user = await this.deps.userRepo.findById(validateUuid(rawUserId));
    if (!user) throw new AppError('NOT_FOUND', 'users.notFound');
    if (!user.isActive) throw new AppError('UNAUTHORIZED', 'auth.accountDeactivated');
    logger.info('User signed in', { userId: user.id, role: user.role, mode: 'dev' });
    return this.createSessionForUser(user);
  }

  private async createSessionForUser(user: StoredUser): Promise<AuthSessionResult> {
    const sessionToken = randomBytes(TOKEN_BYTES).toString('hex');
    const expiresAt = new Date(Date.now() + this.deps.sessionTtlDays * MS_PER_DAY).toISOString();
    await this.deps.sessionRepo.create({ id: randomUUID(), userId: user.id, tokenHash: hashSessionToken(sessionToken), expiresAt });
    return { user: toPublicUser(user), sessionToken, expiresAt };
  }
}
