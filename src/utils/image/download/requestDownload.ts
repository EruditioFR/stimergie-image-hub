
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
        is_hd: isHD
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('Erreur lors de la création de la demande de téléchargement:', error);
      throw new Error(error.message);
    }
    
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
    // Crée d'abord la demande de téléchargement
    const downloadId = await requestImageDownload(imageInfo);
    
    if (!downloadId) {
      return false;
    }
    
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
