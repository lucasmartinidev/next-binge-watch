export type UserRole = 'ADMIN' | 'USER';

export type AuthUser = {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type AuthMeResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

export type CreateUserFormInput = {
  username: string;
  email: string;
  role: UserRole;
  password: string;
};

export type UpdateUserInput = {
  role?: UserRole;
  isActive?: boolean;
};
