
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";

interface UsersHeaderProps {
  onAddClick: () => void;
}

export function UsersHeader({ onAddClick }: UsersHeaderProps) {
  return (
    <div className="bg-muted/30 border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Utilisateurs</h1>
          </div>
          
          <Button onClick={onAddClick} className="gap-2">
            <PlusCircle size={18} />
            Ajouter un utilisateur
          </Button>
        </div>
      </div>
    </div>
  );
}
