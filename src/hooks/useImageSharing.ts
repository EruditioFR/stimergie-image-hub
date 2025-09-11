import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { 
  shareImageWithClient, 
  unshareImageFromClient, 
  getImageSharedClients,
  ImageSharedClient 
} from "@/services/gallery/sharingService";

/**
 * Hook to manage image sharing functionality
 */
export function useImageSharing(imageId: number) {
  const [sharedClients, setSharedClients] = useState<ImageSharedClient[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadSharedClients = useCallback(async () => {
    if (!imageId) return;
    
    setLoading(true);
    try {
      const { data, error } = await getImageSharedClients(imageId);
      if (error) {
        console.error('Error loading shared clients:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les partages",
          variant: "destructive"
        });
      } else {
        setSharedClients(data);
      }
    } catch (error) {
      console.error('Error loading shared clients:', error);
    } finally {
      setLoading(false);
    }
  }, [imageId, toast]);

  const shareWithClient = useCallback(async (clientId: string) => {
    if (!imageId) return false;
    
    try {
      const { success, error } = await shareImageWithClient(imageId, clientId);
      
      if (success) {
        toast({
          title: "Succès",
          description: "Image partagée avec succès"
        });
        await loadSharedClients(); // Refresh the list
        return true;
      } else {
        toast({
          title: "Erreur",
          description: error || "Impossible de partager l'image",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
      return false;
    }
  }, [imageId, toast, loadSharedClients]);

  const unshareFromClient = useCallback(async (clientId: string) => {
    if (!imageId) return false;
    
    try {
      const { success, error } = await unshareImageFromClient(imageId, clientId);
      
      if (success) {
        toast({
          title: "Succès",
          description: "Partage retiré avec succès"
        });
        await loadSharedClients(); // Refresh the list
        return true;
      } else {
        toast({
          title: "Erreur",
          description: error || "Impossible de retirer le partage",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Error unsharing image:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
      return false;
    }
  }, [imageId, toast, loadSharedClients]);

  return {
    sharedClients,
    loading,
    loadSharedClients,
    shareWithClient,
    unshareFromClient
  };
}