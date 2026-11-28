export type UserRole = 'ADMIN' | 'USER';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type AuthChallengeResponse = {
  salt: string;
};

export type AuthMeResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

export type ActiveSessionContext = {
  sessionId: string;
  user: AuthUser;
};

export type AuthSessionResult = {
  user: AuthUser;
  sessionToken: string;
  expiresAt: string;
};

export type LoginInput = {
  identifier: string;
  passwordHash: string;
};

export type ChangePasswordServiceInput = {
  userId: string;
  sessionId: string;
  currentPasswordHash: string;
  newClientSalt: string;
  newPasswordHash: string;
};
