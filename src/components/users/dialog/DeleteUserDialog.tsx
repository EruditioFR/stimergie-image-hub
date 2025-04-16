
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface DeleteUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteUserDialog({ 
  open, 
  onOpenChange, 
  onConfirm 
}: DeleteUserDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const isConfirmDisabled = confirmText !== "DELETE";

  const handleConfirm = () => {
    if (confirmText === "DELETE") {
      onConfirm();
      setConfirmText("");
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) setConfirmText("");
      onOpenChange(newOpen);
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer cet utilisateur ?</AlertDialogTitle>
          <AlertDialogDescription>
            Cette action est irréversible. L'utilisateur sera supprimé de façon permanente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <Alert variant="warning" className="my-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Pour confirmer la suppression, tapez exactement <strong>DELETE</strong> dans le champ ci-dessous.
          </AlertDescription>
        </Alert>
        
        <div className="my-4">
          <Input
            placeholder="Tapez DELETE pour confirmer"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full"
            autoComplete="off"
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <Button 
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Supprimer
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
