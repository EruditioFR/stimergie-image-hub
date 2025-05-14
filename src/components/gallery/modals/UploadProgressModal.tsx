
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, FileUp, CheckCircle } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface UploadProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  isComplete?: boolean;
}

export function UploadProgressModal({ 
  isOpen, 
  onClose,
  isComplete = false
}: UploadProgressModalProps) {
  const navigate = useNavigate();

  const handleGoToDownloads = () => {
    navigate('/downloads');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isComplete ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <FileUp className="h-5 w-5 text-primary" />
            )}
            {isComplete ? "Préparation terminée" : "Préparation en cours"}
          </DialogTitle>
          <DialogDescription className="pt-2 text-base">
            {isComplete ? (
              "Votre archive ZIP est prête et disponible dans la page de téléchargements."
            ) : (
              "La préparation de votre téléchargement est en cours. Vous pouvez quitter cette page et consulter la page \"Téléchargements\" dans quelques instants pour télécharger vos images."
            )}
          </DialogDescription>
        </DialogHeader>

        {!isComplete && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={onClose}
          >
            {isComplete ? "Fermer" : "Continuer sur cette page"}
          </Button>
          <Button 
            onClick={handleGoToDownloads}
            variant="default"
          >
            Aller aux téléchargements
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
