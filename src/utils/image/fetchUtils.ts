
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';

/**
 * Vérifie si un blob est probablement une page HTML et non une image
 */
export function isHtmlContent(blob: Blob): boolean {
  // Vérifier le type MIME
  if (blob.type.includes('text/html') || blob.type.includes('application/xhtml+xml')) {
    return true;
  }
  
  // Même si le type MIME semble correct, certaines réponses d'erreur peuvent avoir
  // un type MIME d'image mais contenir du HTML
  // La taille d'une page HTML d'erreur est généralement petite
  if (blob.size < 1000) {
    return true; // Potentiellement une page d'erreur HTML
  }
  
  return false;
}

/**
 * Télécharge une image depuis n'importe quelle source
 */
export async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    console.log(`Tentative de téléchargement pour: ${url}`);
    
    let fetchUrl;
    
    // Traiter différemment les URLs Dropbox
    if (isDropboxUrl(url)) {
      const directDownloadUrl = getDropboxDownloadUrl(url);
      console.log(`URL Dropbox convertie en URL directe: ${directDownloadUrl}`);
      fetchUrl = getProxiedUrl(directDownloadUrl);
      console.log(`URL finale après proxy: ${fetchUrl}`);
    } else {
      fetchUrl = getProxiedUrl(url);
    }
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*, */*;q=0.8',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Échec du téléchargement: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error(`Réponse de type HTML détectée via les en-têtes: ${contentType}`);
      return null;
    }
    
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error("Blob de téléchargement vide");
      return null;
    }
    
    // Vérifier si la réponse est potentiellement du HTML (page d'erreur) et non une image
    if (isHtmlContent(blob)) {
      console.error("La réponse semble être une page HTML et non une image");
      return null;
    }
    
    console.log(`Image téléchargée avec succès, type: ${blob.type}, taille: ${blob.size} octets`);
    return blob;
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    return null;
  }
}
