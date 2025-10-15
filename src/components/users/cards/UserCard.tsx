
import { User, Client } from "@/types/user";
import { UserRound, Building2, Mail, Shield, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { getRoleDisplay } from "@/utils/roleUtils";

interface UserCardProps {
  user: User;
  clients: Client[];
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export function UserCard({ user, clients, onEdit, onDelete }: UserCardProps) {
  // Get client names from client_ids
  const clientNames = user.client_ids && user.client_ids.length > 0
    ? clients.filter(c => user.client_ids?.includes(c.id)).map(c => c.nom)
    : [];
  
  const hasClients = clientNames.length > 0;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserRound size={18} className="text-muted-foreground" />
            {user.firstName || user.lastName || user.first_name || user.last_name ? (
              `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim()
            ) : (
              <span className="italic text-muted-foreground">Nom non défini</span>
            )}
          </CardTitle>
          <div className="flex gap-2">
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
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3 text-sm">
          <p className="flex items-center gap-2">
            <Mail size={16} className="text-muted-foreground" />
            {user.email}
          </p>
          
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-muted-foreground" />
            <Badge variant="outline" className={getRoleDisplay(user.role).color}>
              {getRoleDisplay(user.role).label}
            </Badge>
          </div>
          
          {hasClients && (
            <div className="flex items-start gap-2">
              <Building2 size={16} className="text-muted-foreground mt-1" />
              <div className="flex flex-wrap gap-1">
                {clientNames.map((name, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
