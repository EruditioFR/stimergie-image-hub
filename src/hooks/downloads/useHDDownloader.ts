
import { useState } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Image } from '@/utils/image/types';
import { validateImageUrl } from '@/utils/image/errorHandler';
import { isJpgUrl } from '@/utils/image/download/networkUtils';
import { transformToHDUrl } from '@/utils/image/download/networkUtils';
import { downloadImagesAsZip } from '@/utils/image/download';
import { User } from '@supabase/supabase-js';

// Seuil à partir duquel on utilise le serveur pour les téléchargements HD
const SERVER_DOWNLOAD_THRESHOLD = 3;

interface UseHDDownloaderOptions {
  redirectOnComplete?: boolean;
}

export function useHDDownloader(options?: UseHDDownloaderOptions) {
  const [isDownloading, setIsDownloading] = useState(false);
  const navigate = useNavigate();
  const redirectOnComplete = options?.redirectOnComplete !== false;

  /**
   * Prépare les données des images pour le téléchargement HD
   */
  const prepareImagesForHDDownload = (images: Image[], selectedIds: string[]) => {
    // Filtrer les images par ID sélectionnés
    const selectedImages = images.filter(img => selectedIds.includes(img.id));
    console.log(`Préparation de ${selectedImages.length} images pour téléchargement HD`);
    
    // Créer un tableau pour les images valides
    const preparedImages = [];
    const failedImages = [];
    
    for (const img of selectedImages) {
      // Extraire le nom du dossier à partir des données du projet
      let folderName = "";
      if (img.projets?.nom_dossier) {
        folderName = img.projets.nom_dossier;
      } else if (img.id_projet) {
        folderName = `project-${img.id_projet}`;
      }
      
      const imageTitle = img.title || `image-${img.id}`;
      
      // Commencer par l'URL stockée ou générée
      let imageUrl = img.url || '';
      
      // Transformer en URL HD en supprimant /JPG/ si présent
      if (imageUrl.includes('/JPG/')) {
        imageUrl = transformToHDUrl(imageUrl);
      }
      
      // En dernier recours: utiliser n'importe quelle URL disponible
      if (!imageUrl && img.display_url) {
        imageUrl = img.display_url;
      } else if (!imageUrl && img.src) {
        imageUrl = img.src;
      }
      
      // Valider l'URL avant de l'ajouter
      const validationResult = validateImageUrl(imageUrl, img.id, imageTitle);
      if (validationResult.isValid && validationResult.url) {
        preparedImages.push({
          id: img.id,
          url: validationResult.url,
          title: imageTitle
        });
      } else {
        console.warn(`Image exclue du téléchargement HD: ${validationResult.error}`);
        failedImages.push(imageTitle);
      }
    }
    
    return { preparedImages, failedImages };
  };

  /**
   * Télécharge directement les images HD en local (pour les petits volumes)
   */
  const downloadHDLocally = async (images: Image[], selectedIds: string[]) => {
    try {
      // Préparer les images pour téléchargement
      const { preparedImages, failedImages } = prepareImagesForHDDownload(images, selectedIds);
      
      if (preparedImages.length === 0) {
        toast.error("Aucune image valide à télécharger en HD");
        return;
      }
      
      // Afficher un avertissement si certaines images ont échoué
      if (failedImages.length > 0) {
        const message = failedImages.length === 1 
          ? "Une image a été exclue du téléchargement HD en raison d'une URL invalide." 
          : `${failedImages.length} images ont été exclues du téléchargement HD en raison d'URLs invalides.`;
          
        toast.warning("Téléchargement HD partiel", { description: message });
      }
      
      // Définir le nom du fichier ZIP
      const zipName = `images_hd_${Date.now()}.zip`;
      
      // Afficher un toast de préparation
      toast.loading("Préparation du ZIP HD en cours", {
        id: "zip-hd-preparation",
        duration: Infinity
      });
      
      // Télécharger les images HD
      await downloadImagesAsZip(preparedImages, zipName, true);
      
      // Fermer le toast de préparation
      toast.dismiss("zip-hd-preparation");
      toast.success("Images HD téléchargées avec succès");
      
    } catch (error) {
      console.error("Erreur lors du téléchargement HD local:", error);
      toast.error("Erreur lors du téléchargement HD", {
        description: "Une erreur est survenue lors du téléchargement des images HD."
      });
    }
  };

  /**
   * Demande au serveur de créer un zip HD (pour les gros volumes)
   */
  const requestServerHDZip = async (user: User, images: Image[], selectedIds: string[]) => {
    try {
      // Préparer les images pour téléchargement
      const { preparedImages, failedImages } = prepareImagesForHDDownload(images, selectedIds);
      
      if (preparedImages.length === 0) {
        toast.error("Aucune image valide à télécharger en HD");
        return;
      }
      
      // Afficher un avertissement si certaines images ont échoué
      if (failedImages.length > 0) {
        const message = failedImages.length === 1 
          ? "Une image a été exclue du téléchargement HD en raison d'une URL invalide." 
          : `${failedImages.length} images ont été exclues du téléchargement HD en raison d'URLs invalides.`;
          
        toast.warning("Téléchargement HD partiel", { description: message });
      }
      
      // Afficher un toast de préparation
      toast.loading("Préparation du téléchargement HD sur le serveur...", {
        id: "server-zip",
        duration: Infinity
      });
      
      // Appeler l'Edge Function pour générer le ZIP sur le serveur
      const { data, error } = await supabase.functions.invoke('generate-hd-zip', {
        body: {
          userId: user.id,
          images: preparedImages
        }
      });
      
      // Fermer le toast de préparation
      toast.dismiss("server-zip");
      
      if (error) {
        console.error('Erreur lors de la génération du ZIP HD:', error);
        toast.error("Échec de la préparation du téléchargement HD", {
          description: error.message || "Une erreur technique est survenue"
        });
        return;
      }
      
      console.log('Réponse de la fonction generate-hd-zip:', data);
      
      // Vérifier si la création du ZIP a réussi
      if (!data.success) {
        toast.error("Échec de la préparation du téléchargement HD", {
          description: data.error || "Une erreur est survenue lors de la création de l'archive"
        });
        return;
      }
      
      // Afficher un message de succès avec le nombre d'images incluses
      const successMessage = data.imageCount === 1 
        ? "1 image HD préparée avec succès"
        : `${data.imageCount} images HD préparées avec succès`;
        
      const hasFailures = data.failedCount > 0;
      const failureMessage = data.failedCount === 1
        ? "1 image n'a pas pu être incluse"
        : `${data.failedCount} images n'ont pas pu être incluses`;
      
      // Afficher le message de succès et proposer la redirection
      toast.success('Téléchargement HD en préparation', {
        description: hasFailures 
          ? `${successMessage}. ${failureMessage}. Vous retrouverez votre téléchargement dans la page dédiée.`
          : `${successMessage}. Vous retrouverez votre téléchargement dans la page dédiée.`,
        action: redirectOnComplete ? {
          label: 'Voir mes téléchargements',
          onClick: () => navigate('/downloads')
        } : undefined,
        duration: 6000
      });
      
      // Rediriger automatiquement vers la page des téléchargements si demandé
      if (redirectOnComplete) {
        setTimeout(() => {
          navigate('/downloads');
        }, 1500);
      }
      
    } catch (error) {
      console.error("Erreur lors de la demande de ZIP HD serveur:", error);
      toast.dismiss("server-zip");
      toast.error("Erreur lors de la préparation du téléchargement HD", {
        description: error.message || "Une erreur technique est survenue"
      });
    }
  };

  /**
   * Gère le téléchargement HD en fonction du nombre d'images
   */
  const downloadHD = async (user: User | null, images: Image[], selectedIds: string[]) => {
    if (selectedIds.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    if (isDownloading) {
      toast.info("Téléchargement déjà en cours, veuillez patienter");
      return;
    }
    
    if (!user) {
      toast.error("Vous devez être connecté pour télécharger des images HD");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Si moins de 3 images, téléchargement direct
      // Sinon, utiliser le serveur
      if (selectedIds.length < SERVER_DOWNLOAD_THRESHOLD) {
        await downloadHDLocally(images, selectedIds);
      } else {
        await requestServerHDZip(user, images, selectedIds);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    downloadHD
  };
}
