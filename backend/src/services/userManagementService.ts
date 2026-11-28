import { randomUUID } from 'node:crypto';
import { logger } from '../config/logger';
import { toPublicUser } from '../data/userRepository';
import type { AuthUser } from '../types/auth';
import { AppError } from '../types/error';
import type { CreateStoredUserInput, CreateUserServiceInput, DeleteUserServiceInput, StoredUser, UpdateStoredUserPatch, UpdateUserServiceInput } from '../types/user';
import type { PasswordService } from './passwordService';
import { validateEmail, validateRole, validateUsername, validateUuid } from './userValidation';

export type ManagedUserStore = {
  findById(userId: string): Promise<StoredUser | null>;
  findByLowerUsername(lowerUsername: string): Promise<StoredUser | null>;
  findByLowerEmail(lowerEmail: string): Promise<StoredUser | null>;
  listAll(): Promise<StoredUser[]>;
  countActiveAdmins(): Promise<number>;
  createWithPrimaryLists(input: CreateStoredUserInput): Promise<StoredUser>;
  updateAccount(userId: string, patch: UpdateStoredUserPatch): Promise<StoredUser | null>;
  deleteById(userId: string): Promise<boolean>;
};

export type ManagedSessionStore = {
  deleteAllForUser(userId: string): Promise<void>;
};

export type UserManagementDeps = {
  userRepo: ManagedUserStore;
  sessionRepo: ManagedSessionStore;
  passwordService: PasswordService;
};

export class UserManagementService {
  constructor(private readonly deps: UserManagementDeps) {}

  async listUsers(): Promise<AuthUser[]> {
    const users = await this.deps.userRepo.listAll();
    return users.map(toPublicUser);
  }

  async createUser(input: CreateUserServiceInput): Promise<AuthUser> {
    const username = validateUsername(input.username);
    const email = validateEmail(input.email);
    const role = validateRole(input.role);
    const clientSalt = this.deps.passwordService.validateClientSalt(input.clientSalt);
    const clientHash = this.deps.passwordService.validateClientHash(input.passwordHash, clientSalt);
    if (await this.deps.userRepo.findByLowerUsername(username.toLowerCase())) {
      throw new AppError('CONFLICT', 'users.usernameTaken');
    }
    if (await this.deps.userRepo.findByLowerEmail(email)) {
      throw new AppError('CONFLICT', 'users.emailTaken');
    }
    const passwordHash = await this.deps.passwordService.hashClientHashForStorage(clientHash);
    const created = await this.deps.userRepo.createWithPrimaryLists({ id: randomUUID(), username, email, role, clientSalt, passwordHash });
    logger.info('Admin created user', { targetUserId: created.id, role: created.role });
    return toPublicUser(created);
  }

  async updateUser(input: UpdateUserServiceInput): Promise<AuthUser> {
    const targetId = validateUuid(input.targetUserId);
    if (input.role === undefined && input.isActive === undefined) {
      throw new AppError('VALIDATION_ERROR', 'users.invalidUpdate');
    }
    const role = input.role === undefined ? undefined : validateRole(input.role);
    if (input.isActive !== undefined && typeof input.isActive !== 'boolean') {
      throw new AppError('VALIDATION_ERROR', 'users.invalidUpdate');
    }
    if (targetId === input.actorUserId) {
      throw new AppError('FORBIDDEN', 'users.cannotModifySelf');
    }
    const existing = await this.deps.userRepo.findById(targetId);
    if (!existing) throw new AppError('NOT_FOUND', 'users.notFound');
    await this.assertAdminInvariant(existing, role, input.isActive);
    const updated = await this.deps.userRepo.updateAccount(targetId, { role, isActive: input.isActive });
    if (!updated) throw new AppError('NOT_FOUND', 'users.notFound');
    if (input.isActive === false) {
      await this.deps.sessionRepo.deleteAllForUser(targetId);
    }
    logger.info('Admin updated user', { actorUserId: input.actorUserId, targetUserId: targetId });
    return toPublicUser(updated);
  }

  async deleteUser(input: DeleteUserServiceInput): Promise<void> {
    const targetId = validateUuid(input.targetUserId);
    if (targetId === input.actorUserId) {
      throw new AppError('FORBIDDEN', 'users.cannotModifySelf');
    }
    const existing = await this.deps.userRepo.findById(targetId);
    if (!existing) throw new AppError('NOT_FOUND', 'users.notFound');
    await this.assertAdminInvariant(existing, 'USER', false);
    await this.deps.userRepo.deleteById(targetId);
    logger.info('Admin deleted user', { actorUserId: input.actorUserId, targetUserId: targetId });
  }

  private async assertAdminInvariant(existing: StoredUser, nextRole?: string, nextActive?: boolean): Promise<void> {
    const wasActiveAdmin = existing.role === 'ADMIN' && existing.isActive;
    const staysActiveAdmin = (nextRole ?? existing.role) === 'ADMIN' && (nextActive ?? existing.isActive);
    if (wasActiveAdmin && !staysActiveAdmin && (await this.deps.userRepo.countActiveAdmins()) <= 1) {
      throw new AppError('FORBIDDEN', 'users.lastAdminProtected');
    }
  }
}
