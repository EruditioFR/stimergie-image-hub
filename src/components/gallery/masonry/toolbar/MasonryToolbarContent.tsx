
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Image } from '@/utils/image/types';
import { SelectionInfo } from './SelectionInfo';
import { DownloadButton } from './DownloadButton';
import { ShareButton } from './ShareButton';
import { ToolbarContainer } from './ToolbarContainer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { downloadImagesAsZip } from '@/utils/image/download';
import { generateDownloadImageHDUrl, generateDownloadImageSDUrl } from '@/utils/image/imageUrlGenerator';
import { validateImageUrl } from '@/utils/image/errorHandler';

interface MasonryToolbarContentProps {
  selectedImages: string[];
  clearSelection: () => void;
  onShareDialogChange: (isOpen: boolean) => void;
  images: Image[];
}

export function MasonryToolbarContent({
  selectedImages,
  clearSelection,
  onShareDialogChange,
  images
}: MasonryToolbarContentProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingHD, setIsDownloadingHD] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleDownload = async () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    if (isDownloading) {
      toast.info("Téléchargement déjà en cours, veuillez patienter");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      if (!user) {
        toast.error("Vous devez être connecté pour télécharger des images");
        setIsDownloading(false);
        return;
      }
      
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      console.log(`Processing ${selectedImagesData.length} images for download`);
      
      // Créer un tableau pour stocker les images valides pour le téléchargement
      const imagesForDownload = [];
      const failedImages = [];
      
      for (const img of selectedImagesData) {
        // Priorité à l'URL stockée en base
        let pngUrl = img.url || '';
        
        // Si l'URL n'est pas une URL PNG ou est vide, essayer de générer une URL
        if (!pngUrl || !pngUrl.includes('/JPG/')) {
          // Extraire le nom du dossier à partir des données du projet ou utiliser un fallback
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
      console.log('First 3 image URLs:', imagesForDownload.slice(0, 3).map(img => img.url));
      
      if (imagesForDownload.length === 0) {
        toast.error("Aucune image valide à télécharger", {
          description: "Les URLs des images sélectionnées sont invalides ou manquantes."
        });
        return;
      }
      
      // Informer l'utilisateur si certaines images ont été exclues
      if (failedImages.length > 0) {
        const message = failedImages.length === 1 
          ? "Une image a été exclue du téléchargement en raison d'une URL invalide." 
          : `${failedImages.length} images ont été exclues du téléchargement en raison d'URLs invalides.`;
          
        toast.warning("Téléchargement partiel", {
          description: message
        });
      }
      
      await downloadImagesAsZip(imagesForDownload, `images_${Date.now()}.zip`);
      toast.success("Images téléchargées avec succès");
      
    } catch (error) {
      console.error("Error during ZIP download:", error);
      toast.error("Erreur lors du téléchargement", {
        description: "Une erreur est survenue lors du téléchargement des images."
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadHD = async () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    if (isDownloadingHD) {
      toast.info("Téléchargement HD déjà en cours, veuillez patienter");
      return;
    }
    
    setIsDownloadingHD(true);
    
    try {
      if (!user) {
        toast.error("Vous devez être connecté pour télécharger des images");
        setIsDownloadingHD(false);
        return;
      }
      
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      console.log(`[handleDownloadHD] Processing ${selectedImagesData.length} images for HD download`);
      
      // Créer un tableau pour stocker les images valides pour le téléchargement HD
      const imagesForDownload = [];
      const failedImages = [];
      
      for (const img of selectedImagesData) {
        // Extraire le nom du dossier à partir des données du projet ou utiliser un fallback
        let folderName = "";
        if (img.projets?.nom_dossier) {
          folderName = img.projets.nom_dossier;
        } else if (img.id_projet) {
          folderName = `project-${img.id_projet}`;
        }
        
        const imageTitle = img.title || `image-${img.id}`;
        
        // Générer l'URL HD selon le nouveau format direct sans /JPG/
        let hdUrl = '';
        
        // Si on a un nom de dossier, générer l'URL HD au format direct
        if (folderName) {
          // Utiliser explicitement la fonction de génération d'URL HD
          hdUrl = generateDownloadImageHDUrl(folderName, imageTitle);
          console.log(`[handleDownloadHD] Generated explicit HD URL: ${hdUrl}`);
          console.log(`[handleDownloadHD] HD URL contains '/JPG/': ${hdUrl.includes('/JPG/')}`);
        } 
        // Sinon priorité à l'URL déjà disponible dans l'objet image
        else if (img.download_url) {
          hdUrl = img.download_url;
          console.log(`[handleDownloadHD] Using existing download_url: ${hdUrl}`);
          console.log(`[handleDownloadHD] download_url contains '/JPG/': ${hdUrl.includes('/JPG/')}`);
        }
        // Dernier recours: utiliser n'importe quelle URL disponible
        else if (img.url) {
          hdUrl = img.url;
          console.log(`[handleDownloadHD] Fallback to image url: ${hdUrl}`);
          console.log(`[handleDownloadHD] url contains '/JPG/': ${hdUrl.includes('/JPG/')}`);
        }
        
        // Valider l'URL avant de l'ajouter
        const validationResult = validateImageUrl(hdUrl, img.id, imageTitle);
        if (validationResult.isValid && validationResult.url) {
          // S'assurer que l'URL HD ne contient pas accidentellement "/JPG/"
          const finalUrl = validationResult.url;
          console.log(`[handleDownloadHD] Final URL for HD download: ${finalUrl}`);
          console.log(`[handleDownloadHD] Final URL contains '/JPG/': ${finalUrl.includes('/JPG/')}`);
          
          imagesForDownload.push({
            url: finalUrl,
            title: img.title || `image_${img.id}`,
            id: img.id
          });
        } else {
          console.warn(`Image HD exclue du téléchargement: ${validationResult.error}`);
          failedImages.push(img.title || `image_${img.id}`);
        }
      }
      
      if (imagesForDownload.length === 0) {
        toast.error("Aucune image valide à télécharger en HD", {
          description: "Les URLs des images sélectionnées sont invalides ou manquantes."
        });
        setIsDownloadingHD(false);
        return;
      }
      
      // Afficher les premières URLs pour debug
      console.log("[handleDownloadHD] First 3 HD download URLs:");
      imagesForDownload.slice(0, 3).forEach((img, i) => {
        console.log(`[handleDownloadHD] ${i+1}. ID: ${img.id}, Title: ${img.title}, URL: ${img.url}`);
        console.log(`[handleDownloadHD] URL contains '/JPG/': ${img.url.includes('/JPG/')}`);
      });
      
      // Informer l'utilisateur si certaines images ont été exclues
      if (failedImages.length > 0) {
        const message = failedImages.length === 1 
          ? "Une image a été exclue du téléchargement HD en raison d'une URL invalide." 
          : `${failedImages.length} images ont été exclues du téléchargement HD en raison d'URLs invalides.`;
          
        toast.warning("Téléchargement HD partiel", {
          description: message
        });
      }
      
      toast.loading("Préparation du ZIP HD en cours", {
        id: "zip-hd-preparation",
        duration: Infinity
      });
      
      // Téléchargement direct en HD - marquage spécial pour traitement HD
      await downloadImagesAsZip(imagesForDownload, `images_hd_${Date.now()}.zip`, true);
      
      toast.dismiss("zip-hd-preparation");
      toast.success("Images HD téléchargées avec succès");
      
    } catch (error) {
      console.error("Error during HD ZIP download:", error);
      toast.error("Erreur lors du téléchargement HD", {
        description: "Une erreur est survenue lors du téléchargement des images HD."
      });
    } finally {
      setIsDownloadingHD(false);
    }
  };

  const openShareDialog = () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image");
      return;
    }
    
    onShareDialogChange(true);
  };

  return (
    <ToolbarContainer>
      <SelectionInfo count={selectedImages.length} onClear={clearSelection} />
      <div className="flex flex-wrap gap-2">
        <DownloadButton 
          isLoading={isDownloading}
          onClick={handleDownload}
          label="Version web & réseaux sociaux"
          sizeHint="(JPG, < 2 Mo)"
        />
        <DownloadButton 
          isLoading={isDownloadingHD}
          onClick={handleDownloadHD}
          label="Version HD impression"
          sizeHint="(JPG, > 20 Mo)"
          mobileLabel="HD"
        />
        <ShareButton onClick={openShareDialog} />
      </div>
    </ToolbarContainer>
  );
}
