
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Interface for download request parameters
 */
export interface DownloadRequestParams {
  imageId: string;
  imageSrc: string;
  imageTitle: string;
  isHD?: boolean;
}

/**
 * Creates a download request in the database
 */
export async function requestDownload({
  imageId,
  imageSrc,
  imageTitle,
  isHD = false
}: DownloadRequestParams): Promise<{success: boolean, downloadId?: string}> {
  try {
    if (!imageId || !imageSrc) {
      toast.error("Informations d'image manquantes");
      return { success: false };
    }
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast.error("Vous devez être connecté pour télécharger des images");
      return { success: false };
    }
    
    const { data, error } = await supabase
      .from('download_requests')
      .insert({
        image_id: imageId,
        image_src: imageSrc,
        image_title: imageTitle || `image-${imageId}`,
        is_hd: isHD,
        status: 'pending',
        user_id: user.id,
        download_url: '' // Provide a default empty value
      })
      .select('id')
      .single();
      
    if (error) {
      console.error('Error creating download request:', error);
      toast.error("Erreur lors de la création de la demande de téléchargement");
      return { success: false };
    }
    
    return { 
      success: true,
      downloadId: data.id
    };
  } catch (error) {
    console.error('Error in requestDownload:', error);
    toast.error("Erreur lors de la création de la demande de téléchargement");
    return { success: false };
  }
}

/**
 * Check the status of a download request
 */
export async function checkDownloadStatus(downloadId: string): Promise<{
  status: string;
  downloadUrl?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('download_requests')
      .select('status, download_url')
      .eq('id', downloadId)
      .single();
      
    if (error) {
      console.error('Error checking download status:', error);
      return { status: 'error' };
    }
    
    return { 
      status: data.status,
      downloadUrl: data.download_url
    };
  } catch (error) {
    console.error('Error in checkDownloadStatus:', error);
    return { status: 'error' };
  }
}
