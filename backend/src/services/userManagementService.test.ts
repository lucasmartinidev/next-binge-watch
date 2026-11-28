import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppError } from '../types/error';
import { InMemorySessionRepository, InMemoryUserRepository } from './inMemoryAuthRepositories';
import { PasswordService } from './passwordService';
import { UserManagementService } from './userManagementService';

describe('UserManagementService (UT-07, UT-08)', () => {
  let userRepo: InMemoryUserRepository;
  let sessionRepo: InMemorySessionRepository;
  let passwordService: PasswordService;
  let service: UserManagementService;
  const adminId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    userRepo = new InMemoryUserRepository();
    sessionRepo = new InMemorySessionRepository(userRepo);
    passwordService = new PasswordService('test-pepper', 4);
    service = new UserManagementService({ userRepo, sessionRepo, passwordService });
    const creds = await passwordService.hashPlaintextTwoStage('password123');
    await userRepo.createWithPrimaryLists({ id: adminId, username: 'admin', email: 'admin@example.com', role: 'ADMIN', ...creds });
  });

  it('creates users with 3 primary lists and rejects case-insensitive duplicates (UT-07)', async () => {
    const clientSalt = await passwordService.generateClientSalt();
    const passwordHash = await bcrypt.hash('viewer-pass', clientSalt);
    const created = await service.createUser({ username: 'Viewer-1', email: 'Viewer@Example.com', role: 'USER', clientSalt, passwordHash });
    expect(created.role).toBe('USER');
    expect(userRepo.provisionedPrimaryListsFor).toContain(created.id);
    await expect(
      service.createUser({ username: 'viewer-1', email: 'other@example.com', role: 'USER', clientSalt, passwordHash }),
    ).rejects.toThrow(AppError);
    await expect(
      service.createUser({ username: 'viewer-2', email: 'VIEWER@example.com', role: 'USER', clientSalt, passwordHash }),
    ).rejects.toThrow(AppError);
  });

  it('updates role/status, revokes sessions on deactivation, and deletes users (UT-07)', async () => {
    const clientSalt = await passwordService.generateClientSalt();
    const passwordHash = await bcrypt.hash('viewer-pass', clientSalt);
    const created = await service.createUser({ username: 'Viewer-1', email: 'viewer@example.com', role: 'USER', clientSalt, passwordHash });
    await sessionRepo.create({ id: 's1', userId: created.id, tokenHash: 'h1', expiresAt: '2099-01-01T00:00:00.000Z' });
    const updated = await service.updateUser({ actorUserId: adminId, targetUserId: created.id, role: 'ADMIN', isActive: false });
    expect(updated.role).toBe('ADMIN');
    expect(updated.isActive).toBe(false);
    expect(sessionRepo.countForUser(created.id)).toBe(0);
    await service.deleteUser({ actorUserId: adminId, targetUserId: created.id });
    expect(await service.listUsers()).toHaveLength(1);
  });

  it('prevents self-modification and protecting the last active ADMIN (UT-08)', async () => {
    await expect(service.updateUser({ actorUserId: adminId, targetUserId: adminId, role: 'USER' })).rejects.toThrow(AppError);
    await expect(service.deleteUser({ actorUserId: adminId, targetUserId: adminId })).rejects.toThrow(AppError);
    const clientSalt = await passwordService.generateClientSalt();
    const passwordHash = await bcrypt.hash('admin2-pass', clientSalt);
    const secondAdmin = await service.createUser({ username: 'admin-2', email: 'admin2@example.com', role: 'ADMIN', clientSalt, passwordHash });
    await expect(service.updateUser({ actorUserId: secondAdmin.id, targetUserId: adminId, isActive: false })).resolves.toMatchObject({
      isActive: false,
    });
  });
});
