
import { User } from "@/pages/Users";
import { UserRound, Building2, Mail, Shield } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UsersListProps {
  users: User[];
  loading?: boolean;
}

export function UsersList({ users, loading = false }: UsersListProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div key={item} className="bg-white shadow-sm rounded-lg p-6 border border-border">
            <Skeleton className="h-6 w-3/4 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-medium mb-2">Aucun utilisateur trouvé</h3>
        <p className="text-muted-foreground">
          {users.length === 0 ? "Aucun utilisateur n'est enregistré dans le système." : "Aucun utilisateur ne correspond au filtre sélectionné."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <div 
          key={user.id} 
          className="bg-white shadow-sm rounded-lg p-6 border border-border hover:shadow-md transition-shadow"
        >
          <h3 className="font-medium text-lg mb-4 flex items-center gap-2">
            <UserRound size={18} className="text-muted-foreground" />
            {user.first_name || user.last_name ? (
              `${user.first_name || ''} ${user.last_name || ''}`.trim()
            ) : (
              <span className="italic text-muted-foreground">Nom non défini</span>
            )}
          </h3>
          
          <div className="space-y-3 text-sm">
            <p className="flex items-center gap-2">
              <Mail size={16} className="text-muted-foreground" />
              {user.email}
            </p>
            
            <p className="flex items-center gap-2">
              <Shield size={16} className="text-muted-foreground" />
              {user.role || "utilisateur"}
            </p>
            
            {user.client_name && (
              <p className="flex items-center gap-2">
                <Building2 size={16} className="text-muted-foreground" />
                {user.client_name}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
