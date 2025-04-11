
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DownloadRequestOptions {
  imageId: string;
  imageTitle: string;
  imageSrc: string;
  isHD?: boolean;
}

/**
 * Prepare a download file by requesting it from the backend
 * Returns a Promise that resolves to true if the request was successful
 */
export async function prepareDownloadFile(options: DownloadRequestOptions): Promise<boolean> {
  const { imageId, imageTitle, imageSrc, isHD = false } = options;
  
  try {
    console.log(`Requesting ${isHD ? 'HD' : 'standard'} download for image: ${imageTitle}`);
    
    // Call the Edge Function to generate the ZIP file with just this image
    const { data, error } = await supabase.functions.invoke('generate-zip', {
      body: {
        images: [{
          id: imageId,
          url: imageSrc,
          title: imageTitle
        }],
        userId: supabase.auth.getUser().then(res => res.data.user?.id),
        isHD: isHD
      }
    });
    
    if (error) {
      console.error("Error calling generate-zip function:", error);
      throw new Error("Erreur lors de la préparation du téléchargement");
    }
    
    console.log("Download request response:", data);
    return true;
  } catch (error) {
    console.error("Error requesting download:", error);
    toast.error("Erreur de préparation", {
      description: "Impossible de préparer le téléchargement. Veuillez réessayer plus tard."
    });
    return false;
  }
}

/**
 * Legacy function for requesting image download
 * @deprecated Use prepareDownloadFile instead
 */
export async function requestImageDownload(options: DownloadRequestOptions): Promise<boolean> {
  return prepareDownloadFile(options);
}
