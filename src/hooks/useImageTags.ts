
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useImageTags = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const updateImageTags = async (imageId: string, tags: string[]) => {
    setIsUpdating(true);
    
    try {
      // Convertir le tableau de tags en string séparée par des virgules
      const tagsString = tags.join(', ');
      
      const { error } = await supabase
        .from('images')
        .update({ tags: tagsString })
        .eq('id', parseInt(imageId));

      if (error) {
        console.error('Erreur lors de la mise à jour des tags:', error);
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: 'Impossible de mettre à jour les mots-clés.'
        });
        return false;
      }

      toast({
        title: 'Succès',
        description: 'Mots-clés mis à jour avec succès.'
      });
      
      return true;
    } catch (error) {
      console.error('Erreur lors de la mise à jour des tags:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur inattendue s\'est produite.'
      });
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateImageTags,
    isUpdating
  };
};
