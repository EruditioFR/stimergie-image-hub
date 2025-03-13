
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { albumFormSchema, AlbumFormValues } from './AlbumFormSchema';
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { DatePickerFormField } from './DatePickerFormField';
import { SelectedImagesPreview } from './SelectedImagesPreview';
import { DialogFooter } from '@/components/ui/dialog';

interface AlbumFormProps {
  selectedImages: any[];
  isSubmitting: boolean;
  onSubmit: (data: AlbumFormValues) => void;
  onCancel: () => void;
}

export function AlbumForm({ selectedImages, isSubmitting, onSubmit, onCancel }: AlbumFormProps) {
  // Initialisation du formulaire
  const form = useForm<AlbumFormValues>({
    resolver: zodResolver(albumFormSchema),
    defaultValues: {
      name: '',
      description: '',
      emails: '',
      message: '',
      accessFrom: new Date(),
      accessUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 jours par défaut
    },
  });

  return (
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
          <DatePickerFormField 
            form={form} 
            name="accessFrom" 
            label="Date de début" 
          />

          <DatePickerFormField 
            form={form} 
            name="accessUntil" 
            label="Date de fin" 
          />
        </div>

        <SelectedImagesPreview selectedImages={selectedImages} />

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
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
  );
}
