import type { AuthUser, UserRole } from '@/types/auth';
import { UserRow } from './UserRow';

type UserTableProps = {
  users: AuthUser[];
  currentUserId: string | null;
  busyId: string | null;
  onChangeRole: (userId: string, role: UserRole) => void;
  onToggleActive: (userId: string, nextActive: boolean) => void;
  onRequestDelete: (user: AuthUser) => void;
};

export function UserTable({ users, currentUserId, busyId, onChangeRole, onToggleActive, onRequestDelete }: UserTableProps) {
  return (
    <ul className="space-y-3">
      {users.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          isSelf={user.id === currentUserId}
          busy={busyId === user.id}
          onChangeRole={onChangeRole}
          onToggleActive={onToggleActive}
          onRequestDelete={onRequestDelete}
        />
      ))}
    </ul>
  );
}
