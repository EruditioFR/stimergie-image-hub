
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';
import { Image } from './types';
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';
import { determineFileExtension, generateNormalizedFilename } from './fileUtils';
import { fetchImageAsBlob } from './fetchUtils';

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
    
    // Afficher une notification de progression
    const progressToastId = toast.loading(`Téléchargement des images en cours (0/${images.length})...`);
    
    // Tableau pour stocker les promesses de téléchargement
    const downloadPromises = images.map(async (img, index) => {
      try {
        // Mise à jour de la toast de progression
        toast.loading(`Téléchargement des images en cours (${index}/${images.length})...`, {
          id: progressToastId
        });
        
        // Télécharger l'image comme blob
        const blob = await fetchImageAsBlob(img.src);
        
        // Si le téléchargement a échoué, passer à l'image suivante
        if (!blob) {
          console.error(`Impossible de télécharger l'image: ${img.src}`);
          toast.error(`Échec de téléchargement: ${img.title || 'Image ' + (index + 1)}`);
          errorCount++;
          return false;
        }
        
        // Déterminer l'extension du fichier
        const extension = determineFileExtension(blob, img.src);
        
        // Générer un nom de fichier normalisé
        const filename = generateNormalizedFilename(img.title, index, extension);
        
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
    
    // Fermer la toast de progression
    toast.dismiss(progressToastId);
    
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
