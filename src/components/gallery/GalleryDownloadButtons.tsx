
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { Image } from '@/utils/image/types';
import { downloadImagesAsZip } from '@/utils/image/download';
import { validateImageUrl } from '@/utils/image/errorHandler';
import { generateDownloadImageHDUrl, generateDownloadImageSDUrl } from '@/utils/image/imageUrlGenerator';
import { isJpgUrl } from '@/utils/image/download/networkUtils';

// Constants for download thresholds
const SD_SERVER_THRESHOLD = 10;  // Use server-side for 10+ images in SD mode
const HD_SERVER_THRESHOLD = 3;   // Use server-side for 3+ images in HD mode

interface GalleryDownloadButtonsProps {
  images: Image[];
}

export function GalleryDownloadButtons({
  images
}: GalleryDownloadButtonsProps) {
  const [isDownloadingSD, setIsDownloadingSD] = useState(false);
  const [isDownloadingHD, setIsDownloadingHD] = useState(false);

  const handleDownload = async (isHD: boolean) => {
    if (images.length === 0) {
      toast.error("Aucune image disponible pour le téléchargement");
      return;
    }
    
    const setIsDownloading = isHD ? setIsDownloadingHD : setIsDownloadingSD;
    const isDownloading = isHD ? isDownloadingHD : isDownloadingSD;
    
    if (isDownloading) {
      toast.info("Téléchargement déjà en cours, veuillez patienter");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Préparer les images pour le téléchargement
      const imagesForDownload = [];
      const failedImages = [];
      
      for (const img of images) {
        // Priorité à l'URL stockée en base
        let imageUrl = img.url || '';

        // Si l'URL n'est pas au format JPG ou est vide, essayer de générer une URL
        if (!imageUrl || !isJpgUrl(imageUrl)) {
          // Extraire le nom du dossier à partir des données du projet
          let folderName = "";
          if (img.projets?.nom_dossier) {
            folderName = img.projets.nom_dossier;
          } else if (img.id_projet) {
            folderName = `project-${img.id_projet}`;
          }
          const imageTitle = img.title || `image-${img.id}`;

          // Générer l'URL selon le mode (HD ou SD)
          if (folderName) {
            // Pour HD, utiliser la fonction spécifique
            const generatedUrl = isHD ? generateDownloadImageHDUrl(folderName, imageTitle) : generateDownloadImageSDUrl(folderName, imageTitle);
            imageUrl = generatedUrl;
          }
        } else if (isHD && imageUrl.includes('/JPG/')) {
          // Si c'est un téléchargement HD et l'URL contient /JPG/, le supprimer
          imageUrl = imageUrl.replace('/JPG/', '/');
        }

        // En dernier recours: utiliser n'importe quelle URL disponible
        if (!imageUrl && img.display_url) {
          imageUrl = img.display_url;
        } else if (!imageUrl && img.src) {
          imageUrl = img.src;
        }

        // Valider l'URL avant de l'ajouter
        const validationResult = validateImageUrl(imageUrl, img.id, img.title || `image_${img.id}`);
        if (validationResult.isValid && validationResult.url) {
          imagesForDownload.push({
            url: validationResult.url,
            title: img.title || `image_${img.id}`,
            id: img.id
          });
        } else {
          console.warn(`Image exclue du téléchargement: ${validationResult.error}`);
          failedImages.push(img.title || `image_${img.id}`);
        }
      }
      
      if (imagesForDownload.length === 0) {
        toast.error("Aucune image valide à télécharger");
        return;
      }

      // Informer l'utilisateur si certaines images ont été exclues
      if (failedImages.length > 0) {
        const message = failedImages.length === 1 ? "Une image a été exclue du téléchargement en raison d'une URL invalide." : `${failedImages.length} images ont été exclues du téléchargement en raison d'URLs invalides.`;
        toast.warning("Téléchargement partiel", {
          description: message
        });
      }
      
      const zipName = isHD ? `images_hd_${Date.now()}.zip` : `images_${Date.now()}.zip`;
      const toastId = isHD ? "zip-hd-preparation" : "zip-preparation";
      const loadingMessage = isHD ? "Préparation du ZIP HD en cours" : "Préparation du téléchargement";

      toast.loading(loadingMessage, {
        id: toastId,
        duration: Infinity
      });

      // Passer le flag isHD pour le traitement approprié
      await downloadImagesAsZip(imagesForDownload, zipName, isHD);
      
      toast.dismiss(toastId);
      toast.success(isHD ? "Images HD téléchargées avec succès" : "Images téléchargées avec succès");
      
    } catch (error) {
      console.error(`Error during ${isHD ? 'HD' : 'SD'} ZIP download:`, error);
      toast.error(`Erreur lors du téléchargement ${isHD ? 'HD' : ''}`, {
        description: "Une erreur est survenue lors du téléchargement des images."
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // Adjust button labels based on count of images
  const getHDButtonLabel = () => {
    if (images.length >= HD_SERVER_THRESHOLD) {
      return "Ajouter à mes téléchargements HD";
    } else {
      return "Version HD impression";
    }
  };

  const getHDButtonHint = () => {
    if (images.length >= HD_SERVER_THRESHOLD) {
      return "(Accessibles via la page Téléchargements)";
    } else {
      return "(JPG, > 20 Mo)";
    }
  };

  const getHDMobileLabel = () => {
    if (images.length >= HD_SERVER_THRESHOLD) {
      return "Téléchargements HD";
    } else {
      return "HD";
    }
  };

  return (
    <div className="flex gap-2">
      <Button 
        onClick={() => handleDownload(false)}
        disabled={isDownloadingSD}
        className="bg-primary text-white"
      >
        {isDownloadingSD ? (
          <span>Téléchargement...</span>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">Version web & réseaux sociaux</span>
            <span className="md:hidden">Télécharger</span>
            <span className="hidden md:inline text-xs opacity-75 ml-1">(JPG, &lt; 2 Mo)</span>
          </>
        )}
      </Button>
      
      <Button 
        onClick={() => handleDownload(true)}
        disabled={isDownloadingHD}
        className={`bg-primary text-white ${images.length >= HD_SERVER_THRESHOLD ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' : ''}`}
      >
        {isDownloadingHD ? (
          <span>Téléchargement HD...</span>
        ) : (
          <>
            <Download className="h-4 w-4 mr-1" />
            <span className="hidden md:inline">{getHDButtonLabel()}</span>
            <span className="md:hidden">{getHDMobileLabel()}</span>
            <span className="hidden md:inline text-xs opacity-75 ml-1">{getHDButtonHint()}</span>
          </>
        )}
      </Button>
    </div>
  );
}
