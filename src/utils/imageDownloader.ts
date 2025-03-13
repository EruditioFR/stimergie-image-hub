
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface Image {
  id: string;
  src: string;
  alt?: string;
  title?: string;
}

/**
 * Vérifie si une URL est une URL Dropbox
 */
function isDropboxUrl(url: string): boolean {
  return url.includes('dropbox.com');
}

/**
 * Extrait le chemin du fichier à partir d'une URL Dropbox
 */
function extractDropboxFilePath(url: string): string | null {
  try {
    // Format typique: https://www.dropbox.com/scl/fi/[id]/[filename]?[params]
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split('/');
    // Le nom de fichier est généralement le dernier élément du chemin
    return pathParts[pathParts.length - 1];
  } catch (error) {
    console.error("Erreur lors de l'extraction du chemin Dropbox:", error);
    return null;
  }
}

/**
 * Convertit une URL Dropbox en URL d'API Dropbox pour le téléchargement direct
 */
function getDropboxApiUrl(url: string): string {
  // Remplacer www.dropbox.com par content.dropboxapi.com et ajuster le chemin
  // Format de l'API pour téléchargement direct: https://content.dropboxapi.com/2/files/download
  if (url.includes('?')) {
    // Extract the shared link parameters if present
    url = url.split('?')[0];
  }
  
  // L'URL de l'API Dropbox pour téléchargement direct
  return 'https://content.dropboxapi.com/2/files/download';
}

/**
 * Solution pour contourner les problèmes CORS avec les sources externes
 */
function getProxiedUrl(url: string): string {
  // Cas 1: Si ce n'est pas une URL Dropbox, utiliser un proxy CORS générique
  if (!isDropboxUrl(url) && url.startsWith('http') && !url.includes(window.location.hostname)) {
    const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    console.log(`URL externe convertie via proxy: ${corsProxyUrl}`);
    return corsProxyUrl;
  }
  
  // Cas 2: URLs internes ou déjà traitées - retourner telles quelles
  return url;
}

/**
 * Télécharge une image depuis Dropbox en utilisant l'API Dropbox
 */
async function downloadFromDropbox(url: string): Promise<Blob | null> {
  try {
    // Pour une URL partagée, nous utilisons un différent endpoint
    const sharedLinkPath = extractDropboxFilePath(url);
    if (!sharedLinkPath) {
      throw new Error("Impossible d'extraire le chemin du fichier Dropbox");
    }
    
    console.log(`Tentative de téléchargement Dropbox pour: ${url}`);
    
    // Pour une URL partagée publique, utiliser la version dl=1
    // Cette approche fonctionne pour les liens partagés sans avoir besoin d'authentification
    const directDownloadUrl = url.includes('dl=0') 
      ? url.replace('dl=0', 'dl=1') 
      : url.includes('dl=1') 
        ? url 
        : `${url}${url.includes('?') ? '&' : '?'}dl=1`;
    
    // Utiliser un proxy CORS pour les téléchargements Dropbox
    const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(directDownloadUrl);
    console.log(`URL Dropbox pour téléchargement direct: ${corsProxyUrl}`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
    
    const response = await fetch(corsProxyUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 Application'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Échec du téléchargement Dropbox: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error("Blob de téléchargement Dropbox vide");
      return null;
    }
    
    console.log(`Image Dropbox téléchargée avec succès, taille: ${blob.size} octets`);
    return blob;
  } catch (error) {
    console.error("Erreur lors du téléchargement depuis Dropbox:", error);
    return null;
  }
}

export async function downloadImages(images: Image[]) {
  if (images.length === 0) {
    toast.error("Veuillez sélectionner au moins une image");
    return;
  }

  try {
    toast.info("Préparation du téléchargement...");
    
    const zip = new JSZip();
    let successCount = 0;
    let errorCount = 0;
    
    const fetchPromises = images.map(async (img, index) => {
      try {
        let blob: Blob | null = null;
        
        // Traiter différemment les URLs Dropbox et les autres URLs
        if (isDropboxUrl(img.src)) {
          console.log(`Utilisation de l'API Dropbox pour: ${img.src}`);
          blob = await downloadFromDropbox(img.src);
        } else {
          // Pour les autres URLs, utiliser l'approche standard avec proxy si nécessaire
          const imageUrl = getProxiedUrl(img.src);
          console.log(`Tentative de téléchargement standard depuis: ${imageUrl}`);
          
          // Utiliser un timeout pour éviter les requêtes bloquées trop longtemps
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
          
          try {
            const response = await fetch(imageUrl, { 
              mode: 'cors',
              credentials: 'omit', // Ne pas envoyer de cookies
              cache: 'no-store', // Ne pas utiliser le cache
              signal: controller.signal,
              headers: {
                // Définir un User-Agent pour éviter d'être bloqué par certains serveurs
                'User-Agent': 'Mozilla/5.0 Application'
              }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              console.error(`Échec lors du téléchargement de ${imageUrl}: ${response.status} ${response.statusText}`);
              throw new Error(`Échec de téléchargement: ${response.status}`);
            }
            
            blob = await response.blob();
            if (blob.size === 0) {
              console.error(`Image téléchargée vide: ${imageUrl}`);
              throw new Error("Blob vide");
            }
            
            console.log(`Image téléchargée avec succès: ${imageUrl}, taille: ${blob.size} octets`);
          } catch (error) {
            console.error(`Erreur lors du téléchargement standard: ${error}`);
            blob = null;
          }
        }
        
        // Si nous n'avons pas réussi à télécharger l'image, on passe à la suivante
        if (!blob) {
          errorCount++;
          return false;
        }
        
        // Déterminer l'extension de fichier à partir du type MIME ou de l'URL
        let extension = 'jpg';
        if (blob.type) {
          extension = blob.type.split('/')[1] || 'jpg';
        } else if (img.src.includes('.')) {
          const urlParts = img.src.split('?')[0]; // Ignorer les paramètres
          extension = urlParts.split('.').pop()?.toLowerCase() || 'jpg';
        }
        
        // Nettoyage de l'extension
        if (extension.includes(';')) {
          extension = extension.split(';')[0];
        }
        
        // Utiliser le titre de l'image si disponible, sinon un numéro
        const filename = `${img.title || `image_${index + 1}`}.${extension}`;
        console.log(`Ajout au zip: ${filename}`);
        
        zip.file(filename, blob);
        successCount++;
        return true;
      } catch (error) {
        console.error(`Erreur lors du traitement de l'image ${img.src}:`, error);
        errorCount++;
        return false;
      }
    });
    
    try {
      // Attendre que toutes les promesses soient résolues
      await Promise.all(fetchPromises);
      console.log("Traitement de toutes les images terminé");
      
      // Vérifier si nous avons réussi à télécharger au moins une image
      if (successCount === 0) {
        toast.error("Aucune image n'a pu être téléchargée. Vérifiez votre connexion internet.");
        return false;
      }
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log(`ZIP généré, taille: ${zipBlob.size} octets`);
      
      if (zipBlob.size < 50) { // Un ZIP vide ou presque vide aurait une taille très petite
        toast.error("Le fichier ZIP généré est vide. Aucune image n'a pu être traitée correctement.");
        return false;
      }
      
      saveAs(zipBlob, `selection_images_${new Date().toISOString().slice(0, 10)}.zip`);
      
      if (errorCount > 0) {
        toast.success(`Téléchargement prêt (${successCount} images, ${errorCount} échecs)`);
      } else {
        toast.success(`Téléchargement prêt (${successCount} images)`);
      }
      
      return true;
    } catch (error) {
      console.error("Erreur lors du traitement des images:", error);
      toast.error("Certaines images n'ont pas pu être téléchargées");
      return false;
    }
  } catch (error) {
    console.error("Erreur lors de la création du zip:", error);
    toast.error("Une erreur est survenue lors du téléchargement");
    return false;
  }
}
