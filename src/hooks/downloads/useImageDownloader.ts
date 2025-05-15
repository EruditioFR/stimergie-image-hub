
import { useState } from 'react';
import { toast } from 'sonner';
import { Image } from '@/utils/image/types';
import { generateDownloadImageHDUrl, generateDownloadImageSDUrl } from '@/utils/image/imageUrlGenerator';
import { validateImageUrl } from '@/utils/image/errorHandler';
import { isJpgUrl, transformToHDUrl } from '@/utils/image/download/networkUtils';
import { User } from '@supabase/supabase-js';
import { useHDDownloader } from './useHDDownloader';
import { requestServerDownload } from '@/utils/image/download/requestDownload';
import { downloadImagesAsZip } from '@/utils/image/download/zipCreator'; // Import directly from source

type ImageDownloadType = 'standard' | 'hd';

interface UseImageDownloaderProps {
  user: User | null;
  images: Image[];
}

// Constants for download thresholds
const SD_SERVER_THRESHOLD = 10;  // Use server-side for 10+ images in SD mode
const HD_SERVER_THRESHOLD = 3;   // Use server-side for 3+ images in HD mode

export const useImageDownloader = ({ user, images }: UseImageDownloaderProps) => {
  const [isDownloadingSD, setIsDownloadingSD] = useState(false);
  const { isDownloading: isDownloadingHD, downloadHD } = useHDDownloader();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  
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
        imageUrl = generateDownloadImageHDUrl(folderName, imageTitle);
      } else if (img.url && img.url.includes('/JPG/')) {
        // Transform existing URL to HD by removing /JPG/ segment
        imageUrl = transformToHDUrl(img.url);
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
  
  const downloadStandard = async (selectedImageIds: string[]) => {
    if (selectedImageIds.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    if (isDownloadingSD) {
      toast.info("Téléchargement déjà en cours, veuillez patienter");
      return;
    }
    
    if (!user) {
      toast.error("Vous devez être connecté pour télécharger des images");
      return;
    }
    
    setIsDownloadingSD(true);
    
    try {
      // Prepare images for download
      const { imagesForDownload, failedImages } = prepareImagesForDownload(selectedImageIds, false);
      
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
      
      // Determine if we should use server-side download based on threshold
      if (imagesForDownload.length >= SD_SERVER_THRESHOLD) {
        console.log(`SD download: Using server-side download for ${imagesForDownload.length} images (threshold: ${SD_SERVER_THRESHOLD})`);
        setShowUploadModal(true);
        const result = await requestServerDownload(user, imagesForDownload, false, false);
        
        if (result) {
          setIsUploadComplete(true);
        } else {
          setShowUploadModal(false);
          throw new Error("Échec du traitement de la demande");
        }
      } else {
        // For fewer images, use direct client-side download
        console.log(`SD download: Using client-side download for ${imagesForDownload.length} images (below threshold: ${SD_SERVER_THRESHOLD})`);
        
        // Start toast notification
        toast.loading("Préparation du téléchargement", {
          id: "zip-preparation",
          duration: Infinity
        });
        
        // Generate zip filename
        const zipName = `images_${Date.now()}.zip`;
        
        // Download images as zip
        await downloadImagesAsZip(imagesForDownload, zipName, false);
        
        toast.dismiss("zip-preparation");
      }
      
    } catch (error) {
      console.error(`Error during standard download:`, error);
      toast.error(`Erreur lors du téléchargement`, {
        description: "Une erreur est survenue lors du téléchargement des images."
      });
      setShowUploadModal(false);
    } finally {
      setIsDownloadingSD(false);
    }
  };
  
  // The HD download with correct thresholds
  const handleHDDownload = async (selectedImageIds: string[]) => {
    if (selectedImageIds.length >= HD_SERVER_THRESHOLD) {
      console.log(`HD download: Using server-side download for ${selectedImageIds.length} images (threshold: ${HD_SERVER_THRESHOLD})`);
      setShowUploadModal(true);
      const result = await downloadHD(user, images, selectedImageIds, true);
      if (result) {
        setIsUploadComplete(true);
      } else {
        setShowUploadModal(false);
      }
    } else {
      console.log(`HD download: Using client-side download for ${selectedImageIds.length} images (below threshold: ${HD_SERVER_THRESHOLD})`);
      await downloadHD(user, images, selectedImageIds);
    }
  };

  const closeUploadModal = () => {
    setShowUploadModal(false);
    setIsUploadComplete(false);
  };
  
  return {
    isDownloadingSD,
    isDownloadingHD,
    downloadStandard,
    downloadHD: handleHDDownload,
    showUploadModal,
    isUploadComplete,
    closeUploadModal
  };
};
