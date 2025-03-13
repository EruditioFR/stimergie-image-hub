
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

// Définition du schéma de validation
const formSchema = z.object({
  name: z.string().min(3, { message: 'Le nom doit contenir au moins 3 caractères' }),
  description: z.string().optional(),
  emails: z.string().min(5, { message: 'Veuillez entrer au moins une adresse email valide' }),
  message: z.string().optional(),
  accessFrom: z.date({ required_error: 'Veuillez sélectionner une date de début' }),
  accessUntil: z.date({ required_error: 'Veuillez sélectionner une date de fin' }),
}).refine(data => data.accessUntil > data.accessFrom, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["accessUntil"],
});

type FormValues = z.infer<typeof formSchema>;

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

  // Initialisation du formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      emails: '',
      message: '',
      accessFrom: new Date(),
      accessUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours par défaut
    },
  });

  // Fonction pour créer un album et envoyer les mails
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      toast.error("Vous devez être connecté pour partager des images");
      return;
    }

    if (selectedImageIds.length === 0) {
      toast.error("Aucune image sélectionnée");
      return;
    }

    setIsSubmitting(true);

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
          share_key: shareKey
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

      // Envoyer le lien par email - à implémenter dans un edge function
      const emails = data.emails.split(',').map(email => email.trim());
      
      // Appelez ici la fonction d'envoi d'e-mail (en fonction edge)
      toast.success('Album partagé avec succès!');
      
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur lors du partage:", error);
      toast.error(`Une erreur est survenue: ${error.message}`);
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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de l'album</FormLabel>
                  <FormControl>
                    <Input placeholder="Mon album de photos" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Description de l'album..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="emails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Adresses email des destinataires</FormLabel>
                  <FormControl>
                    <Input placeholder="email1@example.com, email2@example.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Séparez les adresses email par des virgules
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Message personnalisé (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Votre message aux destinataires..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex flex-col sm:flex-row gap-4">
              <FormField
                control={form.control}
                name="accessFrom"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Date de début</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="accessUntil"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel>Date de fin</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Sélectionner une date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="mt-4 bg-muted/30 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Images sélectionnées ({selectedImages.length})</h4>
              <div className="flex flex-wrap gap-2">
                {selectedImages.slice(0, 5).map((image) => (
                  <div key={image.id} className="w-16 h-16 rounded-md overflow-hidden relative">
                    <img src={image.src} alt={image.alt} className="w-full h-full object-cover" />
                  </div>
                ))}
                {selectedImages.length > 5 && (
                  <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center">
                    <span className="text-sm">+{selectedImages.length - 5}</span>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Partager l'album"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
