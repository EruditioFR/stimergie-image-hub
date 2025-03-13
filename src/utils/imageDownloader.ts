
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
 * Convertit une URL Dropbox en URL de téléchargement direct
 */
function convertDropboxUrl(url: string): string {
  // Si c'est une URL Dropbox, assurons-nous qu'elle est configurée pour le téléchargement direct
  if (url.includes('dropbox.com') && url.includes('?')) {
    // Remplacer le paramètre dl=1 ou ajouter le paramètre si manquant
    if (url.includes('dl=0')) {
      return url.replace('dl=0', 'dl=1');
    } else if (url.includes('dl=1')) {
      return url; // Déjà correctement formatée
    } else {
      // Ajouter le paramètre dl=1 à l'URL
      return `${url}&dl=1`;
    }
  }
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
        // Convertir l'URL pour le téléchargement direct si nécessaire
        const imageUrl = convertDropboxUrl(img.src);
        console.log(`Tentative de téléchargement depuis: ${imageUrl}`);
        
        // Utiliser un timeout pour éviter les requêtes bloquées trop longtemps
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 secondes timeout
        
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
        } else if (imageUrl.includes('.')) {
          const urlParts = imageUrl.split('?')[0]; // Ignorer les paramètres
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
