
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DownloadRequestOptions {
  imageId: string;
  imageSrc: string;
  imageTitle: string;
  isHD?: boolean;
}

/**
 * Crée une demande de téléchargement dans la base de données
 * La demande est initialement créée avec le statut "pending"
 * et sera mise à jour par le système une fois le fichier prêt
 */
export async function requestImageDownload(options: DownloadRequestOptions): Promise<string | null> {
  try {
    const { imageId, imageSrc, imageTitle, isHD = false } = options;
    
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!user) {
      toast.error('Vous devez être connecté pour télécharger des images');
      return null;
    }
    
    console.log('Creating download request for:', { imageId, imageTitle, userId: user.id, isHD });
    
    // Crée la requête de téléchargement avec le statut "pending"
    const { data, error } = await supabase
      .from('download_requests')
      .insert({
        user_id: user.id,
        image_id: imageId,
        image_title: imageTitle,
        image_src: imageSrc,
        status: 'pending',
        download_url: '', // Sera mis à jour par le système une fois le fichier prêt
        is_hd: isHD,
        // expires_at est défini par défaut dans la base de données comme now() + '7 days'
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la demande de téléchargement:', error);
      throw new Error(error.message);
    }
    
    console.log('Download request created successfully with ID:', data.id);
    return data.id;
  } catch (error) {
    console.error('Erreur lors de la demande de téléchargement:', error);
    toast.error('Échec de la demande de téléchargement', {
      description: 'Une erreur est survenue. Veuillez réessayer plus tard.'
    });
    return null;
  }
}

/**
 * Cette fonction peut être utilisée pour déclencher une 
 * préparation de fichier côté serveur (edge function)
 */
export async function prepareDownloadFile(imageInfo: DownloadRequestOptions): Promise<boolean> {
  try {
    console.log('Preparing download file for:', imageInfo);
    
    // Crée d'abord la demande de téléchargement
    const downloadId = await requestImageDownload(imageInfo);
    
    if (!downloadId) {
      console.error('Failed to create download request');
      return false;
    }
    
    console.log('Download request created, ID:', downloadId);
    
    // Ici, on pourrait appeler une edge function pour préparer le fichier
    // par exemple:
    /*
    const { error } = await supabase.functions.invoke('prepare-download', {
      body: { 
        downloadId,
        imageInfo
      }
    });
    
    if (error) {
      console.error('Erreur lors de la préparation du fichier:', error);
      throw new Error(error.message);
    }
    */
    
    // For testing purposes, let's directly update the status to "ready" after a short delay
    // This simulates the edge function completing its work
    setTimeout(async () => {
      try {
        console.log('Simulating completed processing for download ID:', downloadId);
        const { error } = await supabase
          .from('download_requests')
          .update({ 
            status: 'ready',
            download_url: imageInfo.imageSrc // Just use the original URL for now
          })
          .eq('id', downloadId);
          
        if (error) {
          console.error('Error updating download status:', error);
        } else {
          console.log('Download status updated to ready');
        }
      } catch (err) {
        console.error('Error in simulated processing:', err);
      }
    }, 5000); // Simulate 5 seconds of processing
    
    toast.success('Demande de téléchargement enregistrée', {
      description: 'Vous serez notifié lorsque votre fichier sera prêt à télécharger.'
    });
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la préparation du fichier:', error);
    toast.error('Échec de la préparation du fichier', {
      description: 'Une erreur est survenue. Veuillez réessayer plus tard.'
    });
    return false;
  }
}
