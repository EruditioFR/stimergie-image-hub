
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { downloadImagesAsZip } from '@/utils/image/download';
import { Image } from '@/utils/image/types';
import { generateDownloadImageSDUrl, generateDownloadImageHDUrl } from '@/utils/image/imageUrlGenerator';
import { validateImageUrl } from '@/utils/image/errorHandler';

interface GalleryDownloadButtonsProps {
  images: Image[];
}

export function GalleryDownloadButtons({ images }: GalleryDownloadButtonsProps) {
  const [isDownloadingWeb, setIsDownloadingWeb] = useState(false);
  const [isDownloadingHD, setIsDownloadingHD] = useState(false);
  
  // Download all images in web/SD format (with /JPG/)
  const handleWebDownload = async () => {
    if (images.length === 0) {
      toast.error("Aucune image disponible");
      return;
    }
    
    if (isDownloadingWeb) {
      toast.info("Téléchargement déjà en cours, veuillez patienter");
      return;
    }
    
    setIsDownloadingWeb(true);
    
    try {
      // Préparer les images pour le téléchargement
      const imagesForDownload = [];
      const failedImages = [];
      
      for (const img of images) {
        // Priorité à l'URL stockée en base
        let pngUrl = img.url || '';
        
        // Si l'URL n'est pas une URL PNG ou est vide, essayer de générer une URL
        if (!pngUrl || !pngUrl.includes('/JPG/')) {
          // Extraire le nom du dossier à partir des données du projet
          let folderName = "";
          if (img.projets?.nom_dossier) {
            folderName = img.projets.nom_dossier;
          } else if (img.id_projet) {
            folderName = `project-${img.id_projet}`;
          }
          
          const imageTitle = img.title || `image-${img.id}`;
          
          // Générer l'URL JPG uniquement si nécessaire
          if (folderName) {
            const generatedUrl = generateDownloadImageSDUrl(folderName, imageTitle);
            if (!pngUrl) {
              pngUrl = generatedUrl;
            }
          }
        }
        
        // En dernier recours: utiliser n'importe quelle URL disponible
        if (!pngUrl && img.display_url) {
          pngUrl = img.display_url;
        } else if (!pngUrl && img.src) {
          pngUrl = img.src;
        }
        
        // Valider l'URL avant de l'ajouter
        const validationResult = validateImageUrl(pngUrl, img.id, img.title || `image_${img.id}`);
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
      
      console.log(`Prepared ${imagesForDownload.length} images for ZIP download`);
      
      if (imagesForDownload.length === 0) {
        toast.error("Aucune image valide à télécharger");
        return;
      }
      
      toast.loading("Préparation du ZIP en cours", {
        id: "gallery-web-zip",
        duration: Infinity  // Correction ici: "Infinity" -> Infinity
      });
      
      await downloadImagesAsZip(imagesForDownload, `images_web_${Date.now()}.zip`);
      
      toast.dismiss("gallery-web-zip");
      toast.success(`${imagesForDownload.length} images téléchargées avec succès`);
      
    } catch (error) {
      console.error("Error during ZIP download:", error);
      toast.error("Erreur lors du téléchargement", {
        description: "Une erreur est survenue lors du téléchargement des images."
      });
    } finally {
      setIsDownloadingWeb(false);
    }
  };
  
  // Download all images in HD format (without /JPG/)
  const handleHDDownload = async () => {
    if (images.length === 0) {
      toast.error("Aucune image disponible");
      return;
    }
    
    if (isDownloadingHD) {
      toast.info("Téléchargement HD déjà en cours, veuillez patienter");
      return;
    }
    
    setIsDownloadingHD(true);
    
    try {
      // Préparer les images pour le téléchargement HD
      const imagesForDownload = [];
      const failedImages = [];
      
      console.log(`[handleHDDownload] Processing ${images.length} images for HD download`);
      
      for (const img of images) {
        // Extraire le nom du dossier à partir des données du projet
        let folderName = "";
        if (img.projets?.nom_dossier) {
          folderName = img.projets.nom_dossier;
        } else if (img.id_projet) {
          folderName = `project-${img.id_projet}`;
        }
        
        const imageTitle = img.title || `image-${img.id}`;
        let hdUrl = '';
        
        // Si on a un nom de dossier, générer l'URL HD au format direct (sans /JPG/)
        if (folderName) {
          hdUrl = generateDownloadImageHDUrl(folderName, imageTitle);
          console.log(`[handleHDDownload] Generated explicit HD URL: ${hdUrl}`);
        } 
        // Sinon priorité à l'URL déjà disponible
        else if (img.download_url) {
          hdUrl = img.download_url;
        } else if (img.url) {
          hdUrl = img.url;
        }
        
        // Valider l'URL avant de l'ajouter
        const validationResult = validateImageUrl(hdUrl, img.id, imageTitle);
        if (validationResult.isValid && validationResult.url) {
          imagesForDownload.push({
            url: validationResult.url,
            title: img.title || `image_${img.id}`,
            id: img.id
          });
        } else {
          failedImages.push(img.title || `image_${img.id}`);
        }
      }
      
      console.log(`[handleHDDownload] Prepared ${imagesForDownload.length} images for HD ZIP download`);
      
      if (imagesForDownload.length === 0) {
        toast.error("Aucune image valide à télécharger en HD");
        return;
      }
      
      // Afficher les premières URLs pour debug
      imagesForDownload.slice(0, 3).forEach((img, i) => {
        console.log(`[handleHDDownload] ${i+1}. ID: ${img.id}, Title: ${img.title}, URL: ${img.url}`);
        console.log(`[handleHDDownload] URL contains '/JPG/': ${img.url.includes('/JPG/')}`);
      });
      
      toast.loading("Préparation du ZIP HD en cours", {
        id: "gallery-hd-zip",
        duration: Infinity  // Correction ici: "Infinity" -> Infinity
      });
      
      // Téléchargement en HD - marquage spécial pour traitement HD
      await downloadImagesAsZip(imagesForDownload, `images_hd_${Date.now()}.zip`, true);
      
      toast.dismiss("gallery-hd-zip");
      toast.success(`${imagesForDownload.length} images HD téléchargées avec succès`);
      
    } catch (error) {
      console.error("Error during HD ZIP download:", error);
      toast.error("Erreur lors du téléchargement HD");
    } finally {
      setIsDownloadingHD(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2 justify-end py-2 px-4">
      <Button 
        onClick={handleWebDownload}
        disabled={isDownloadingWeb || images.length === 0}
        className="bg-primary text-white"
      >
        {isDownloadingWeb ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Download className="h-4 w-4 mr-1" />
        )}
        <span className="hidden sm:inline">Format Web</span>
        <span className="sm:hidden">Web</span>
      </Button>
      
      <Button 
        onClick={handleHDDownload}
        disabled={isDownloadingHD || images.length === 0}
        variant="outline"
        className="border-primary text-primary hover:bg-primary/10"
      >
        {isDownloadingHD ? (
          <LoadingSpinner size="sm" />
        ) : (
          <Download className="h-4 w-4 mr-1" />
        )}
        <span className="hidden sm:inline">Format HD</span>
        <span className="sm:hidden">HD</span>
      </Button>
    </div>
  );
}
