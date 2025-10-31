
/**
 * Module pour gérer l'upload de fichiers vers le serveur O2Switch
 */

import { toast } from "sonner";

// Configuration pour O2Switch
const O2SWITCH_UPLOAD_ENDPOINT = 'https://www.stimergie.fr/upload-zip.php';
const O2SWITCH_API_KEY = 'D5850UGNHB3RY6Z16SIGQCDDQGFQ398F';
const O2SWITCH_PUBLIC_URL_BASE = 'https://www.stimergie.fr/zip-downloads/';

// Type pour le résultat de l'upload
export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  httpStatus?: number;
}

/**
 * Télécharge un fichier ZIP vers le serveur O2Switch avec retry logic
 * @param zipBlob Blob du fichier ZIP à télécharger
 * @param fileName Nom du fichier à utiliser
 * @param retryCount Nombre de tentatives restantes
 * @returns Objet UploadResult avec le résultat de l'upload
 */
export async function uploadZipToO2Switch(
  zipBlob: Blob,
  fileName: string,
  retryCount = 3
): Promise<UploadResult> {
  const sizeMB = Math.round(zipBlob.size / 1024 / 1024);
  
  // Timeouts adaptatifs selon la taille
  let timeout: number;
  if (sizeMB < 50) {
    timeout = 120000; // 2 minutes
  } else if (sizeMB < 100) {
    timeout = 180000; // 3 minutes
  } else if (sizeMB < 200) {
    timeout = 300000; // 5 minutes
  } else {
    timeout = 420000; // 7 minutes
  }
  
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
        let errorText: string;
        let errorDetail: string;
        
        try {
          errorText = await response.text();
          // Tenter de parser comme JSON pour obtenir plus de détails
          try {
            const errorJson = JSON.parse(errorText);
            errorDetail = errorJson.error || errorText;
          } catch {
            errorDetail = errorText;
          }
        } catch {
          errorText = `HTTP ${response.status}`;
          errorDetail = response.statusText || 'Erreur serveur inconnue';
        }
        
        console.error(`[O2Switch] Upload failed with status: ${response.status}`);
        console.error(`[O2Switch] Error response: ${errorText}`);
        console.error(`[O2Switch] File: ${fileName}, Size: ${sizeMB}MB, Timeout: ${timeout / 1000}s`);
        
        return {
          success: false,
          error: `Échec upload serveur (${response.status}): ${errorDetail.substring(0, 150)}`,
          httpStatus: response.status
        };
      }
      
      const result = await response.json();
      
      // Vérifier la réponse
      if (result.error) {
        console.error(`[O2Switch] Server returned error: ${result.error}`);
        return {
          success: false,
          error: `Erreur serveur: ${result.error}`,
          httpStatus: response.status
        };
      }
      
      if (!result.url) {
        console.error('[O2Switch] No URL in response:', result);
        return {
          success: false,
          error: "URL de téléchargement non fournie dans la réponse du serveur"
        };
      }
      
      console.log(`[O2Switch] Upload successful. File available at: ${result.url}`);
      
      // Retourner le succès avec l'URL
      return {
        success: true,
        url: result.url
      };
      
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      // Gestion du timeout
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        const errorMsg = `Timeout après ${timeout / 1000}s pour ${sizeMB}MB - Le fichier est trop volumineux ou le serveur est surchargé`;
        console.error(`[O2Switch] ${errorMsg}`);
        return {
          success: false,
          error: errorMsg
        };
      }
      
      // Erreur réseau ou autre
      const errorMsg = fetchError instanceof Error ? fetchError.message : 'Erreur réseau inconnue';
      console.error(`[O2Switch] Network error:`, errorMsg);
      return {
        success: false,
        error: `Erreur réseau: ${errorMsg}`
      };
    }
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(`[O2Switch] Error uploading file (attempt ${4 - retryCount}/3):`, errorMsg);
    console.error(`[O2Switch] Error details:`, error);
    
    // Retry logic : réessayer si des tentatives restent avec backoff exponentiel
    if (retryCount > 1) {
      // Backoff exponentiel: 2s, 5s, 10s
      const waitTimes = [2000, 5000, 10000];
      const waitTime = waitTimes[3 - retryCount] || 2000;
      
      console.log(`[O2Switch] Retrying in ${waitTime / 1000}s... (${4 - retryCount}/3)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return uploadZipToO2Switch(zipBlob, fileName, retryCount - 1);
    }
    
    // Dernière tentative échouée
    const finalError = `Échec après 3 tentatives: ${errorMsg}`;
    console.error(`[O2Switch] ${finalError}`);
    
    toast.error("Échec du téléchargement vers le serveur", {
      description: errorMsg.substring(0, 100)
    });
    
    return {
      success: false,
      error: finalError
    };
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
