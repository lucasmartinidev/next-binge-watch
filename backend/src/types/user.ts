import type { AuthUser, UserRole } from './auth';

export type StoredUser = AuthUser & {
  clientSalt: string;
  passwordHash: string;
  updatedAt: string;
};

export type CreateUserServiceInput = {
  username: string;
  email: string;
  role: UserRole;
  clientSalt: string;
  passwordHash: string;
};

export type CreateStoredUserInput = CreateUserServiceInput & {
  id: string;
};

export type UpdateUserServiceInput = {
  actorUserId: string;
  targetUserId: string;
  role?: UserRole;
  isActive?: boolean;
};

export type UpdateStoredUserPatch = {
  role?: UserRole;
  isActive?: boolean;
};

export type DeleteUserServiceInput = {
  actorUserId: string;
  targetUserId: string;
};
