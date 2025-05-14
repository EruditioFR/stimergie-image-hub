
import { useState } from 'react';
import { toast } from 'sonner';
import { Image } from '@/utils/image/types';
import { downloadImagesAsZip } from '@/utils/image/download';
import { generateDownloadImageSDUrl } from '@/utils/image/imageUrlGenerator';
import { validateImageUrl } from '@/utils/image/errorHandler';
import { isJpgUrl } from '@/utils/image/download/networkUtils';
import { User } from '@supabase/supabase-js';

type ImageDownloadType = 'standard' | 'hd';

interface UseImageDownloaderProps {
  user: User | null;
  images: Image[];
}

export const useImageDownloader = ({ user, images }: UseImageDownloaderProps) => {
  const [isDownloadingSD, setIsDownloadingSD] = useState(false);
  const [isDownloadingHD, setIsDownloadingHD] = useState(false);
  
  const prepareImagesForDownload = (selectedImageIds: string[], isHD: boolean) => {
    // Filter images by selected IDs
    const selectedImagesData = images.filter(img => selectedImageIds.includes(img.id));
    console.log(`Processing ${selectedImagesData.length} images for ${isHD ? 'HD' : 'standard'} download`);
    
    const imagesForDownload = [];
    const failedImages = [];
    
    // Process each image
    for (const img of selectedImagesData) {
      const { url, title } = prepareImageForDownload(img, isHD);
      
      if (url) {
        imagesForDownload.push({
          url,
          title,
          id: img.id
        });
      } else {
        failedImages.push(title);
      }
    }
    
    return { imagesForDownload, failedImages };
  };
  
  const prepareImageForDownload = (img: Image, isHD: boolean) => {
    // Extract image properties
    let imageUrl = img.url || '';
    const imageTitle = img.title || `image-${img.id}`;
    let folderName = "";
    
    // Get folder name from project data
    if (img.projets?.nom_dossier) {
      folderName = img.projets.nom_dossier;
    } else if (img.id_projet) {
      folderName = `project-${img.id_projet}`;
    }
    
    // Generate or transform URL based on download type
    if (isHD) {
      // For HD downloads
      if (folderName) {
        // If we have folder name, generate explicit HD URL
        const { generateDownloadImageHDUrl } = require('@/utils/image/imageUrlGenerator');
        imageUrl = generateDownloadImageHDUrl(folderName, imageTitle);
      } else if (img.url && img.url.includes('/JPG/')) {
        // Transform existing URL to HD by removing /JPG/ segment
        imageUrl = img.url.replace('/JPG/', '/');
      }
    } else {
      // For standard downloads
      if ((!imageUrl || !isJpgUrl(imageUrl)) && folderName) {
        // Generate standard URL if needed
        imageUrl = generateDownloadImageSDUrl(folderName, imageTitle);
      }
    }
    
    // Fallback to any available URL
    if (!imageUrl) {
      imageUrl = img.display_url || img.src || '';
    }
    
    // Validate URL
    const validationResult = validateImageUrl(imageUrl, img.id, imageTitle);
    if (validationResult.isValid && validationResult.url) {
      return { url: validationResult.url, title: imageTitle };
    }
    
    // Log failure and return empty URL
    console.warn(`Image excluded from download: ${validationResult.error}`);
    return { url: '', title: imageTitle };
  };
  
  const downloadImages = async (selectedImageIds: string[], downloadType: ImageDownloadType) => {
    const isHD = downloadType === 'hd';
    const setIsDownloading = isHD ? setIsDownloadingHD : setIsDownloadingSD;
    const isDownloading = isHD ? isDownloadingHD : isDownloadingSD;
    
    if (selectedImageIds.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    if (isDownloading) {
      toast.info("Téléchargement déjà en cours, veuillez patienter");
      return;
    }
    
    if (!user) {
      toast.error("Vous devez être connecté pour télécharger des images");
      return;
    }
    
    setIsDownloading(true);
    
    try {
      // Prepare images for download
      const { imagesForDownload, failedImages } = prepareImagesForDownload(selectedImageIds, isHD);
      
      if (imagesForDownload.length === 0) {
        toast.error("Aucune image valide à télécharger", {
          description: "Les URLs des images sélectionnées sont invalides ou manquantes."
        });
        return;
      }
      
      // Show warning for failed images
      if (failedImages.length > 0) {
        const message = failedImages.length === 1 
          ? "Une image a été exclue du téléchargement en raison d'une URL invalide." 
          : `${failedImages.length} images ont été exclues du téléchargement en raison d'URLs invalides.`;
        
        toast.warning("Téléchargement partiel", { description: message });
      }
      
      // Start toast notification
      const toastId = isHD ? "zip-hd-preparation" : "zip-preparation";
      const loadingMessage = isHD ? "Préparation du ZIP HD en cours" : "Préparation du téléchargement";
      
      toast.loading(loadingMessage, {
        id: toastId,
        duration: Infinity
      });
      
      // Generate zip filename
      const zipName = isHD ? `images_hd_${Date.now()}.zip` : `images_${Date.now()}.zip`;
      
      // Download images as zip
      await downloadImagesAsZip(imagesForDownload, zipName, isHD);
      
      toast.dismiss(toastId);
      
    } catch (error) {
      console.error(`Error during ${isHD ? 'HD' : 'standard'} download:`, error);
      toast.error(`Erreur lors du téléchargement ${isHD ? 'HD' : ''}`, {
        description: "Une erreur est survenue lors du téléchargement des images."
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  return {
    isDownloadingSD,
    isDownloadingHD,
    downloadStandard: (selectedImageIds: string[]) => downloadImages(selectedImageIds, 'standard'),
    downloadHD: (selectedImageIds: string[]) => downloadImages(selectedImageIds, 'hd')
  };
};
