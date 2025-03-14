
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UserFormHeaderProps {
  isEditing: boolean;
  onCancel: () => void;
}

export function UserFormHeader({ isEditing, onCancel }: UserFormHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h2 className="text-xl font-semibold">
        {isEditing ? "Modifier l'utilisateur" : "Ajouter un nouvel utilisateur"}
      </h2>
      <Button variant="ghost" size="icon" onClick={onCancel}>
        <X className="h-5 w-5" />
      </Button>
    </div>
  );
}
