
/**
 * Module pour gérer l'upload de fichiers vers le serveur O2Switch
 */

import { toast } from "sonner";

// Configuration pour O2Switch
const O2SWITCH_UPLOAD_ENDPOINT = 'https://www.stimergie.fr/upload-zip.php';
const O2SWITCH_API_KEY = 'D5850UGNHB3RY6Z16SIGQCDDQGFQ398F';
const O2SWITCH_PUBLIC_URL_BASE = 'https://www.stimergie.fr/zip-downloads/';

/**
 * Télécharge un fichier ZIP vers le serveur O2Switch avec retry logic
 * @param zipBlob Blob du fichier ZIP à télécharger
 * @param fileName Nom du fichier à utiliser
 * @param retryCount Nombre de tentatives restantes
 * @returns URL publique du fichier téléchargé ou null en cas d'erreur
 */
export async function uploadZipToO2Switch(
  zipBlob: Blob,
  fileName: string,
  retryCount = 3
): Promise<string | null> {
  const sizeMB = Math.round(zipBlob.size / 1024 / 1024);
  const timeout = sizeMB > 100 ? 180000 : 120000; // 3 minutes pour >100MB, sinon 2 minutes
  
  console.log(`[O2Switch] Uploading ${fileName} (${sizeMB}MB) - Attempt ${4 - retryCount}/3`);
  
  try {
    // Créer un FormData pour l'upload
    const formData = new FormData();
    formData.append('file', zipBlob, fileName);
    
    // Créer un AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      // Envoyer la requête avec l'authentification et timeout
      const response = await fetch(O2SWITCH_UPLOAD_ENDPOINT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${O2SWITCH_API_KEY}`,
        },
        body: formData,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[O2Switch] Upload failed with status: ${response.status}`);
        console.error(`[O2Switch] Error response: ${errorText}`);
        throw new Error(`Échec de l'upload (${response.status}: ${errorText.substring(0, 100)})`);
      }
      
      const result = await response.json();
      
      // Vérifier la réponse
      if (result.error) {
        throw new Error(result.error);
      }
      
      if (!result.url) {
        throw new Error("URL de téléchargement non fournie dans la réponse");
      }
      
      console.log(`[O2Switch] Upload successful. File available at: ${result.url}`);
      
      // Retourner directement l'URL fournie par le serveur
      return result.url;
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Gestion du timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error(`Timeout après ${timeout / 1000}s - Le fichier est peut-être trop volumineux`);
      }
      
      throw fetchError;
    }
    
  } catch (error) {
    console.error(`[O2Switch] Error uploading file (attempt ${4 - retryCount}/3):`, error);
    
    // Retry logic : réessayer si des tentatives restent
    if (retryCount > 1) {
      const waitTime = (4 - retryCount) * 2000; // 2s, 4s entre les tentatives
      console.log(`[O2Switch] Retrying in ${waitTime / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return uploadZipToO2Switch(zipBlob, fileName, retryCount - 1);
    }
    
    // Dernière tentative échouée
    toast.error("Échec du téléchargement vers le serveur", {
      description: error instanceof Error ? error.message : "Une erreur inconnue est survenue"
    });
    return null;
  }
}

/**
 * Vérifie si un fichier existe sur le serveur O2Switch
 * @param fileName Nom du fichier à vérifier
 * @returns URL publique du fichier s'il existe, null sinon
 */
export async function checkFileExistsOnO2Switch(fileName: string): Promise<string | null> {
  try {
    // Construire l'URL directe
    const fileUrl = `${O2SWITCH_PUBLIC_URL_BASE}${fileName}`;
    
    // Vérifier si le fichier existe avec une requête HEAD
    const response = await fetch(fileUrl, { method: 'HEAD' });
    
    if (response.ok) {
      console.log(`[O2Switch] File ${fileName} exists at ${fileUrl}`);
      return fileUrl;
    } else {
      console.log(`[O2Switch] File ${fileName} does not exist (status: ${response.status})`);
      return null;
    }
  } catch (error) {
    console.error('[O2Switch] Error checking file existence:', error);
    return null;
  }
}

/**
 * Génère une URL de téléchargement pour un fichier ZIP sur O2Switch
 * en se basant sur le nom du fichier
 * @param fileName Nom du fichier ZIP
 * @returns URL publique du fichier
 */
export function getO2SwitchFileUrl(fileName: string): string {
  return `${O2SWITCH_PUBLIC_URL_BASE}${fileName}`;
}
