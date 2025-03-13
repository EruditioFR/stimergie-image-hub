
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
 * Solution pour contourner les problèmes CORS avec Dropbox
 * Modifier l'URL pour utiliser dl=1 et convertir vers un format CORS-friendly
 */
function getProxiedUrl(url: string): string {
  // Cas 1: URLs Dropbox - tenter d'utiliser une approche différente
  if (url.includes('dropbox.com')) {
    // Convertir l'URL pour utiliser le dl=1 (téléchargement direct)
    const urlWithDownload = url.includes('dl=0') 
      ? url.replace('dl=0', 'dl=1') 
      : url.includes('dl=1') 
        ? url 
        : `${url}${url.includes('?') ? '&' : '?'}dl=1`;
    
    // Utiliser un proxy CORS pour contourner les restrictions
    // Note: Dans un environnement de production, vous devriez utiliser votre propre proxy
    const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(urlWithDownload);
    console.log(`URL Dropbox convertie: ${corsProxyUrl}`);
    return corsProxyUrl;
  }
  
  // Cas 2: Autres URLs externes - essayer avec un proxy CORS
  if (url.startsWith('http') && !url.includes(window.location.hostname)) {
    const corsProxyUrl = 'https://corsproxy.io/?' + encodeURIComponent(url);
    console.log(`URL externe convertie: ${corsProxyUrl}`);
    return corsProxyUrl;
  }
  
  // Cas 3: URLs internes ou déjà traitées - retourner telles quelles
  return url;
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
        // Obtenir l'URL compatible CORS
        const imageUrl = getProxiedUrl(img.src);
        console.log(`Tentative de téléchargement depuis: ${imageUrl}`);
        
        // Utiliser un timeout pour éviter les requêtes bloquées trop longtemps
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 secondes timeout
        
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
          errorCount++;
          return false;
        }
        
        const blob = await response.blob();
        if (blob.size === 0) {
          console.error(`Image téléchargée vide: ${imageUrl}`);
          errorCount++;
          return false;
        }
        
        console.log(`Image téléchargée avec succès: ${imageUrl}, taille: ${blob.size} octets`);
        
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
