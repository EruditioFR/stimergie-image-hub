
import { Button } from "@/components/ui/button";

interface UserFormActionsProps {
  onCancel: () => void;
  isEditing: boolean;
}

export function UserFormActions({ onCancel, isEditing }: UserFormActionsProps) {
  return (
    <div className="flex justify-end gap-3 pt-4">
      <Button type="button" variant="outline" onClick={onCancel}>
        Annuler
      </Button>
      <Button type="submit">
        {isEditing ? "Mettre à jour" : "Enregistrer"}
      </Button>
    </div>
  );
}
