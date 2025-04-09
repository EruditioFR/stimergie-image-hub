
import React, { useState } from 'react';
import { toast } from 'sonner';
import { Image } from '@/utils/image/types';
import { downloadImagesAsZip } from '@/utils/image/download';
import { SelectionInfo } from './SelectionInfo';
import { DownloadButton } from './DownloadButton';
import { ShareButton } from './ShareButton';
import { ToolbarContainer } from './ToolbarContainer';

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
    
    toast.loading("Préparation du téléchargement...", {
      id: "zip-preparation" 
    });
    
    try {
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      
      const imagesForDownload = selectedImagesData.map(img => {
        const url = img.url;
        
        return {
          url: url,
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });
      
      await downloadImagesAsZip(imagesForDownload, "images_stimergie.zip");
    } catch (error) {
      console.error("Error during ZIP download:", error);
      toast.dismiss("zip-preparation");
      toast.error("Erreur lors du téléchargement du ZIP", {
        description: "Une erreur est survenue pendant la création du fichier ZIP."
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
    
    toast.loading("Préparation du téléchargement HD...", {
      id: "zip-hd-preparation"
    });
    
    try {
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      
      const imagesForDownload = selectedImagesData.map(img => {
        const url = img.url;
        
        return {
          url: url,
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });
      
      await downloadImagesAsZip(imagesForDownload, "images_hd_stimergie.zip");
    } catch (error) {
      console.error("Error during HD ZIP download:", error);
      toast.dismiss("zip-hd-preparation");
      toast.error("Erreur lors du téléchargement du ZIP HD", {
        description: "Une erreur est survenue pendant la création du fichier ZIP HD."
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
          sizeHint="(< 2 Mo)"
        />
        <DownloadButton 
          isLoading={isDownloadingHD}
          onClick={handleDownloadHD}
          label="Version HD impression"
          sizeHint="(> 20 Mo)"
          mobileLabel="HD"
        />
        <ShareButton onClick={openShareDialog} />
      </div>
    </ToolbarContainer>
  );
}
