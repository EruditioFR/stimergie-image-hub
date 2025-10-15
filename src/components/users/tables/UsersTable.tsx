
import { User, Client } from "@/types/user";
import { UserRound, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getRoleDisplay } from "@/utils/roleUtils";

interface UsersTableProps {
  users: User[];
  clients: Client[];
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export function UsersTable({ users, clients, onEdit, onDelete }: UsersTableProps) {
  const getClientNames = (user: User) => {
    if (user.client_ids && user.client_ids.length > 0) {
      return clients.filter(c => user.client_ids?.includes(c.id)).map(c => c.nom);
    }
    return [];
  };
  return (
    <div className="w-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nom</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rôle</TableHead>
            <TableHead>Client</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <UserRound size={16} className="text-muted-foreground" />
                  {user.firstName || user.lastName || user.first_name || user.last_name ? (
                    `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim()
                  ) : (
                    <span className="italic text-muted-foreground">Nom non défini</span>
                  )}
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getRoleDisplay(user.role).color}>
                  {getRoleDisplay(user.role).label}
                </Badge>
              </TableCell>
              <TableCell>
                {(() => {
                  const clientNames = getClientNames(user);
                  return clientNames.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {clientNames.map((name, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {name}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">Non spécifié</span>
                  );
                })()}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {onEdit && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onEdit(user)}
                      title="Modifier"
                    >
                      <Pencil size={16} />
                    </Button>
                  )}
                  {onDelete && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => onDelete(user.id)}
                      title="Supprimer"
                      className="text-destructive hover:text-destructive/90"
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
