
import { User, Client } from "@/types/user";
import { ViewMode } from "@/components/ui/ViewToggle";
import { UsersLoadingState } from "./states/UsersLoadingState";
import { UsersEmptyState } from "./states/UsersEmptyState";
import { UserCard } from "./cards/UserCard";
import { UsersTable } from "./tables/UsersTable";

interface UsersListProps {
  users: User[];
  clients: Client[];
  loading?: boolean;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
  viewMode?: ViewMode;
}

export function UsersList({ 
  users, 
  clients,
  loading = false, 
  onEdit, 
  onDelete,
  viewMode = "card"
}: UsersListProps) {
  if (loading) {
    return <UsersLoadingState viewMode={viewMode} />;
  }

  if (users.length === 0) {
    return <UsersEmptyState isEmpty={true} />;
  }

  // Card view
  if (viewMode === "card") {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <UserCard 
            key={user.id} 
            user={user}
            clients={clients}
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
      </div>
    );
  }

  // List view
  return <UsersTable users={users} clients={clients} onEdit={onEdit} onDelete={onDelete} />;
}
