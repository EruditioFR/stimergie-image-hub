
import { User } from "@/types/user";
import { UserRound, Building2, Mail, Shield, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
  onDelete?: (userId: string) => void;
}

export function UserCard({ user, onEdit, onDelete }: UserCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserRound size={18} className="text-muted-foreground" />
            {user.first_name || user.last_name ? (
              `${user.first_name || ''} ${user.last_name || ''}`.trim()
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
      </CardContent>
    </Card>
  );
}
