
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
function getDropboxDownloadUrl(url: string): string {
  // Pour une URL partagée publique, utiliser la version dl=1
  // Cette approche fonctionne pour les liens partagés sans avoir besoin d'authentification
  return url.includes('dl=0') 
    ? url.replace('dl=0', 'dl=1') 
    : url.includes('dl=1') 
      ? url 
      : `${url}${url.includes('?') ? '&' : '?'}dl=1`;
}

/**
 * Solution pour contourner les problèmes CORS avec les sources externes
 */
function getProxiedUrl(url: string): string {
  // Utiliser un proxy CORS pour toutes les URL externes
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    console.log(`URL externe convertie via proxy: ${corsProxyUrl}`);
    return corsProxyUrl;
  }
  
  // URLs internes - retourner telles quelles
  return url;
}

/**
 * Télécharge une image depuis n'importe quelle source
 */
async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    console.log(`Tentative de téléchargement pour: ${url}`);
    
    let fetchUrl;
    
    // Traiter différemment les URLs Dropbox
    if (isDropboxUrl(url)) {
      const directDownloadUrl = getDropboxDownloadUrl(url);
      fetchUrl = getProxiedUrl(directDownloadUrl);
      console.log(`URL Dropbox convertie: ${fetchUrl}`);
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
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 Application'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Échec du téléchargement: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error("Blob de téléchargement vide");
      return null;
    }
    
    console.log(`Image téléchargée avec succès, type: ${blob.type}, taille: ${blob.size} octets`);
    return blob;
  } catch (error) {
    console.error("Erreur lors du téléchargement:", error);
    return null;
  }
}

export async function downloadImages(images: Image[]) {
  if (images.length === 0) {
    toast.error("Veuillez sélectionner au moins une image");
    return;
  }

  try {
    toast.info(`Préparation du téléchargement de ${images.length} images...`);
    
    const zip = new JSZip();
    let successCount = 0;
    let errorCount = 0;
    
    // Tableau pour stocker les promesses de téléchargement
    const downloadPromises = images.map(async (img, index) => {
      try {
        // Télécharger l'image comme blob
        const blob = await fetchImageAsBlob(img.src);
        
        // Si le téléchargement a échoué, passer à l'image suivante
        if (!blob) {
          console.error(`Impossible de télécharger l'image: ${img.src}`);
          errorCount++;
          return false;
        }
        
        // Déterminer l'extension de fichier à partir du type MIME ou de l'URL
        let extension = 'jpg'; // Extension par défaut
        
        if (blob.type) {
          // Extraire l'extension du type MIME (ex: image/jpeg -> jpeg)
          const mimeType = blob.type.split('/');
          if (mimeType.length > 1 && mimeType[1]) {
            extension = mimeType[1].split(';')[0]; // Enlever les paramètres éventuels
          }
        } else if (img.src.includes('.')) {
          // Extraire l'extension de l'URL (ex: image.png -> png)
          const urlParts = img.src.split('?')[0]; // Ignorer les paramètres de l'URL
          const extPart = urlParts.split('.').pop();
          if (extPart) {
            extension = extPart.toLowerCase();
          }
        }
        
        // Normaliser certaines extensions
        if (extension === 'jpeg') extension = 'jpg';
        if (extension === 'svg+xml') extension = 'svg';
        
        // Utiliser le titre de l'image si disponible, sinon un numéro
        let filename = img.title ? img.title.trim() : `image_${index + 1}`;
        
        // Remplacer les caractères problématiques dans le nom de fichier
        filename = filename.replace(/[\/\\:*?"<>|]/g, '_');
        
        // Ajouter l'extension si elle n'est pas déjà présente
        if (!filename.toLowerCase().endsWith(`.${extension}`)) {
          filename = `${filename}.${extension}`;
        }
        
        console.log(`Ajout au zip: ${filename} (${blob.size} octets)`);
        
        // Ajouter le blob au zip avec le nom de fichier approprié
        zip.file(filename, blob);
        successCount++;
        return true;
      } catch (error) {
        console.error(`Erreur lors du traitement de l'image ${img.src}:`, error);
        errorCount++;
        return false;
      }
    });
    
    // Attendre que tous les téléchargements soient terminés
    await Promise.all(downloadPromises);
    
    // Vérifier si nous avons réussi à télécharger au moins une image
    if (successCount === 0) {
      toast.error("Aucune image n'a pu être téléchargée. Vérifiez votre connexion internet.");
      return false;
    }
    
    // Générer le ZIP
    toast.info("Génération du fichier ZIP...");
    const zipBlob = await zip.generateAsync({ 
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    console.log(`ZIP généré, taille: ${zipBlob.size} octets`);
    
    if (zipBlob.size < 100) { // Un ZIP vide ou presque vide aurait une taille très petite
      toast.error("Le fichier ZIP généré est vide. Aucune image n'a pu être traitée correctement.");
      return false;
    }
    
    // Télécharger le ZIP
    saveAs(zipBlob, `selection_images_${new Date().toISOString().slice(0, 10)}.zip`);
    
    // Afficher un message de succès
    if (errorCount > 0) {
      toast.success(`Téléchargement prêt (${successCount} images, ${errorCount} échecs)`);
    } else {
      toast.success(`Téléchargement prêt (${successCount} images)`);
    }
    
    return true;
  } catch (error) {
    console.error("Erreur lors de la création du zip:", error);
    toast.error("Une erreur est survenue lors du téléchargement");
    return false;
  }
}
