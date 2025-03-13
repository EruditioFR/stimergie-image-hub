
import React, { useState } from 'react';
import { AlbumFormValues } from './AlbumFormSchema';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';
import { AlbumForm } from './AlbumForm';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CreateAlbumDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedImageIds: string[];
  selectedImages: any[];
}

export function CreateAlbumDialog({ 
  isOpen, 
  onOpenChange, 
  selectedImageIds, 
  selectedImages 
}: CreateAlbumDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Fonction pour créer un album et envoyer les mails
  const onSubmit = async (data: AlbumFormValues) => {
    if (!user) {
      toast.error("Vous devez être connecté pour partager des images");
      return;
    }

    if (selectedImageIds.length === 0) {
      toast.error("Aucune image sélectionnée");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Création de l'album et envoi des invitations...");

    try {
      // Générer une clé de partage unique
      const shareKey = nanoid(16);

      // Créer l'album
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .insert({
          name: data.name,
          description: data.description,
          created_by: user.id,
          access_from: data.accessFrom.toISOString(),
          access_until: data.accessUntil.toISOString(),
          share_key: shareKey,
          recipients: data.emails.split(',').map(email => email.trim())
        })
        .select('id')
        .single();

      if (albumError) {
        throw new Error(`Erreur lors de la création de l'album: ${albumError.message}`);
      }

      // Associer les images à l'album
      const albumImagesData = selectedImageIds.map(imageId => ({
        album_id: albumData.id,
        image_id: parseInt(imageId)
      }));

      const { error: imagesError } = await supabase
        .from('album_images')
        .insert(albumImagesData);

      if (imagesError) {
        throw new Error(`Erreur lors de l'ajout des images à l'album: ${imagesError.message}`);
      }

      // Envoyer les invitations par email via la fonction Edge
      const emails = data.emails.split(',').map(email => email.trim());
      
      const { data: invitationResponse, error: invitationError } = await supabase.functions.invoke(
        'send-album-invitation',
        {
          body: {
            albumId: albumData.id,
            albumName: data.name,
            shareKey,
            recipients: emails,
            message: data.message,
            accessFrom: data.accessFrom.toISOString(),
            accessUntil: data.accessUntil.toISOString()
          }
        }
      );
      
      if (invitationError) {
        console.error("Erreur lors de l'envoi des invitations:", invitationError);
        toast.error(`Les emails n'ont pas pu être envoyés: ${invitationError.message}`, { id: toastId });
      } else {
        toast.success('Album partagé avec succès! Invitations envoyées.', { id: toastId });
      }
      
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur lors du partage:", error);
      toast.error(`Une erreur est survenue: ${error.message}`, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Partage de photos</DialogTitle>
          <DialogDescription>
            Vous souhaitez partager {selectedImages.length} photo{selectedImages.length > 1 ? 's' : ''} avec des contacts externes ? 
            Remplissez le formulaire ci-dessous. Le destinataire recevra un lien de partage par mail et l'album sera accessible selon les dates spécifiées.
          </DialogDescription>
        </DialogHeader>
        
        <AlbumForm 
          selectedImages={selectedImages}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
