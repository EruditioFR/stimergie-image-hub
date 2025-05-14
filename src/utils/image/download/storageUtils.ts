
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getO2SwitchFileUrl, checkFileExistsOnO2Switch } from "./o2switchUploader";

/**
 * Vérifie si le bucket zip_downloads existe et est correctement configuré (obsolète avec O2Switch)
 * Gardée pour compatibilité mais n'a plus d'utilité réelle
 */
export async function ensureZipBucketExists(): Promise<boolean> {
  console.log('[Storage] O2Switch est maintenant utilisé au lieu des buckets Supabase');
  return true;
}

/**
 * Génère une URL publique pour un fichier ZIP sur O2Switch
 * @param fileName Nom du fichier ZIP
 * @returns URL publique ou null en cas d'erreur
 */
export async function getZipFileUrl(fileName: string): Promise<string | null> {
  try {
    // Vérifier si le fichier existe sur O2Switch
    const fileExists = await checkFileExistsOnO2Switch(fileName);
    if (fileExists) {
      return fileExists;
    }
    
    // Si le fichier n'existe pas, générer quand même l'URL
    // car elle pourrait être valide mais pas encore accessible via HTTP
    return getO2SwitchFileUrl(fileName);
  } catch (error) {
    console.error('Erreur dans getZipFileUrl:', error);
    return null;
  }
}

/**
 * Télécharge un fichier depuis une URL et le stocke sur O2Switch (obsolète)
 * Gardée pour compatibilité mais n'est plus appelée directement
 */
export async function storeDownloadedFile(url: string, fileName: string): Promise<string | null> {
  console.warn('storeDownloadedFile est obsolète avec O2Switch. Utilisez uploadZipToO2Switch à la place.');
  return null;
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
