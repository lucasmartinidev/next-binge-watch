import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../types/error';
import { AuthService } from './authService';
import { InMemorySessionRepository, InMemoryUserRepository } from './inMemoryAuthRepositories';
import { PasswordService } from './passwordService';

describe('AuthService (UT-04, UT-05, UT-06)', () => {
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let passwordService: PasswordService;
  let authService: AuthService;

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository(userRepo);
    passwordService = new PasswordService('test-pepper', 4);
    authService = new AuthService({ userRepo, sessionRepo, passwordService, sessionTtlDays: 7 });
    const creds = await passwordService.hashPlaintextTwoStage('password123');
    await userRepo.createWithPrimaryLists({
      id: '11111111-1111-1111-1111-111111111111',
      username: 'Super-Admin',
      email: 'admin@example.com',
      role: 'ADMIN',
      ...creds,
    });
  });

  it('issues challenge and authenticates via username or email case-insensitively (UT-04)', async () => {
    const challenge = await authService.issueChallenge('SUPER-ADMIN');
    const clientHash = await bcrypt.hash('password123', challenge.salt);
    const session = await authService.login({ identifier: 'ADMIN@EXAMPLE.COM', passwordHash: clientHash });
    expect(session.user.username).toBe('Super-Admin');
    const active = await authService.getSessionByToken(session.sessionToken);
    expect(active?.user.id).toBe(session.user.id);
    await authService.logout(active!.sessionId);
    expect(await authService.getSessionByToken(session.sessionToken)).toBeNull();
  });

  it('rejects invalid credentials and deactivated users (UT-04)', async () => {
    const fakeChallenge = await authService.issueChallenge('missing@example.com');
    const fakeHash = await bcrypt.hash('password123', fakeChallenge.salt);
    await expect(authService.login({ identifier: 'missing@example.com', passwordHash: fakeHash })).rejects.toThrow(AppError);
    await userRepo.updateAccount('11111111-1111-1111-1111-111111111111', { isActive: false });
    const inactiveChallenge = await authService.issueChallenge('Super-Admin');
    expect(inactiveChallenge.salt).toBe(passwordService.deriveFakeClientSalt('super-admin'));
  });

  it('changes password and revokes other sessions while keeping current session (UT-05)', async () => {
    const challenge = await authService.issueChallenge('Super-Admin');
    const oldClientHash = await bcrypt.hash('password123', challenge.salt);
    const firstSession = await authService.login({ identifier: 'Super-Admin', passwordHash: oldClientHash });
    const secondSession = await authService.login({ identifier: 'Super-Admin', passwordHash: oldClientHash });
    const secondActive = await authService.getSessionByToken(secondSession.sessionToken);
    const newClientSalt = await passwordService.generateClientSalt();
    const newPasswordHash = await bcrypt.hash('new-password-456', newClientSalt);
    await authService.changePassword({
      userId: firstSession.user.id,
      sessionId: secondActive!.sessionId,
      currentPasswordHash: oldClientHash,
      newClientSalt,
      newPasswordHash,
    });
    expect(await authService.getSessionByToken(firstSession.sessionToken)).toBeNull();
    expect(await authService.getSessionByToken(secondSession.sessionToken)).not.toBeNull();
  });

  it('lists DEV users and rejects DEV login for inactive users (UT-06)', async () => {
    const users = await authService.listDevUsers();
    expect(users).toHaveLength(1);
    const devSession = await authService.loginAsDevUser('11111111-1111-1111-1111-111111111111');
    expect(devSession.user.email).toBe('admin@example.com');
    await userRepo.updateAccount('11111111-1111-1111-1111-111111111111', { isActive: false });
    await expect(authService.loginAsDevUser('11111111-1111-1111-1111-111111111111')).rejects.toThrow(AppError);
  });

  it('handles null logout/session tokens, deactivated login, and password-change guardrails', async () => {
    await authService.logout(null);
    expect(await authService.getSessionByToken(null)).toBeNull();
    const challenge = await authService.issueChallenge('Super-Admin');
    const validClientHash = await bcrypt.hash('password123', challenge.salt);
    const wrongClientHash = await bcrypt.hash('wrong-pass', challenge.salt);
    const newSalt = await passwordService.generateClientSalt();
    const newHash = await bcrypt.hash('brand-new-pass', newSalt);
    await expect(authService.changePassword({ userId: '11111111-1111-1111-1111-111111111111', sessionId: 's1', currentPasswordHash: wrongClientHash, newClientSalt: newSalt, newPasswordHash: newHash })).rejects.toThrow(AppError);
    await expect(authService.changePassword({ userId: '11111111-1111-1111-1111-111111111111', sessionId: 's1', currentPasswordHash: validClientHash, newClientSalt: challenge.salt, newPasswordHash: validClientHash })).rejects.toThrow(AppError);
    await userRepo.updateAccount('11111111-1111-1111-1111-111111111111', { isActive: false });
    await expect(authService.login({ identifier: 'Super-Admin', passwordHash: validClientHash })).rejects.toThrow(AppError);
    await expect(authService.getPasswordChallenge('11111111-1111-1111-1111-111111111111')).rejects.toThrow(AppError);
  });
});
