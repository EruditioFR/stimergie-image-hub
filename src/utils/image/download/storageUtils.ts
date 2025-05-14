
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Vérifie si le bucket zip_downloads existe et est correctement configuré
 */
export async function ensureZipBucketExists(): Promise<boolean> {
  try {
    // Vérifier si le bucket existe
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Erreur lors de la vérification des buckets:', bucketsError.message);
      return false;
    }
    
    const zipBucket = buckets?.find(b => b.name === "zip_downloads" || b.name === "ZIP Downloads");
    
    if (!zipBucket) {
      // Créer le bucket s'il n'existe pas
      console.log('Création du bucket zip_downloads');
      const { error: createError } = await supabase.storage.createBucket('zip_downloads', { 
        public: true,
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (createError) {
        console.error('Échec de la création du bucket:', createError.message);
        return false;
      }
      
      console.log('Bucket zip_downloads créé avec succès');
      return true;
    }
    
    console.log('Le bucket zip_downloads existe déjà');
    return true;
  } catch (error) {
    console.error('Erreur dans ensureZipBucketExists:', error);
    return false;
  }
}

/**
 * Génère une URL publique pour un fichier ZIP dans le bucket
 * @param fileName Nom du fichier ZIP
 * @returns URL publique ou null en cas d'erreur
 */
export async function getZipFileUrl(fileName: string): Promise<string | null> {
  try {
    await ensureZipBucketExists();
    
    // Updated to handle the new API response structure
    // The getPublicUrl method now returns { data: { publicUrl: string } } without an error property
    const { data } = supabase.storage
      .from('zip_downloads')
      .getPublicUrl(fileName);
    
    if (!data || !data.publicUrl) {
      console.error('Erreur: URL publique non disponible');
      return null;
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error('Erreur dans getZipFileUrl:', error);
    return null;
  }
}

/**
 * Télécharge un fichier depuis une URL et le stocke dans le bucket zip_downloads
 * @param url URL du fichier à télécharger
 * @param fileName Nom du fichier dans le bucket
 * @returns URL publique du fichier stocké ou null en cas d'erreur
 */
export async function storeDownloadedFile(url: string, fileName: string): Promise<string | null> {
  try {
    // S'assurer que le bucket existe
    await ensureZipBucketExists();
    
    // Télécharger le fichier
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Échec du téléchargement: ${response.status} ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // Stocker le fichier dans le bucket
    const { error: uploadError } = await supabase.storage
      .from('zip_downloads')
      .upload(fileName, blob, {
        contentType: 'application/zip',
        upsert: true
      });
    
    if (uploadError) {
      console.error('Erreur lors du stockage du fichier:', uploadError.message);
      return null;
    }
    
    // Générer l'URL publique
    return await getZipFileUrl(fileName);
  } catch (error) {
    console.error('Erreur dans storeDownloadedFile:', error);
    return null;
  }
}

/**
 * Met à jour le statut d'une demande de téléchargement
 * @param downloadId ID de la demande de téléchargement
 * @param status Nouveau statut
 * @param downloadUrl URL de téléchargement (optionnel)
 */
export async function updateDownloadStatus(
  downloadId: string,
  status: 'pending' | 'ready' | 'expired',
  downloadUrl?: string
): Promise<boolean> {
  try {
    const updateData: Record<string, any> = { 
      status,
      processed_at: new Date().toISOString()
    };
    
    if (downloadUrl) {
      updateData.download_url = downloadUrl;
    }
    
    const { error } = await supabase
      .from('download_requests')
      .update(updateData)
      .eq('id', downloadId);
    
    if (error) {
      console.error('Erreur lors de la mise à jour du statut:', error.message);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Erreur dans updateDownloadStatus:', error);
    return false;
  }
}
