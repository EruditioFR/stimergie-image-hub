
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

  // Helper function to decode query parameters from URLs if needed
  const decodeUrlIfNeeded = (url: string): string => {
    try {
      // If URL appears to be encoded, decode it
      if (url.includes('%')) {
        // Only decode if it looks like a valid encoded URL
        return decodeURIComponent(url);
      }
      return url;
    } catch (e) {
      console.error('Error decoding URL:', e);
      return url; // Return original URL if decoding fails
    }
  };

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
      
      const imagesForDownload = selectedImagesData.map(img => {
        return {
          url: decodeUrlIfNeeded(img.url),
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });
      
      console.log("Sending ZIP request:", {
        userId: user.id,
        imageCount: imagesForDownload.length,
        isHD: false
      });
      
      // Show immediate toast
      toast.loading("Préparation du ZIP en cours", { 
        id: "zip-preparation", 
        duration: 10000
      });
      
      // Call the Edge Function to generate the ZIP file
      const { data, error } = await supabase.functions.invoke('generate-zip', {
        body: {
          images: imagesForDownload,
          userId: user.id,
          isHD: false
        }
      });
      
      toast.dismiss("zip-preparation");
      
      if (error) {
        console.error("Error calling generate-zip function:", error);
        throw new Error("Erreur lors de la génération du ZIP");
      }
      
      console.log("Function response:", data);
      
      toast.success("Demande de téléchargement envoyée", {
        description: "Le ZIP sera disponible dans votre page Téléchargements"
      });
      
      // Ask if the user wants to navigate to the downloads page
      toast("Voir vos téléchargements ?", {
        action: {
          label: "Accéder",
          onClick: () => navigate("/downloads")
        },
        duration: 10000
      });
      
    } catch (error) {
      console.error("Error during ZIP request:", error);
      toast.error("Erreur lors de la préparation du téléchargement", {
        description: "Une erreur est survenue lors du traitement de votre demande."
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
      
      const imagesForDownload = selectedImagesData.map(img => {
        return {
          url: decodeUrlIfNeeded(img.url),
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });
      
      console.log("Sending HD ZIP request:", {
        userId: user.id,
        imageCount: imagesForDownload.length,
        isHD: true
      });
      
      // Show immediate toast
      toast.loading("Préparation du ZIP HD en cours", { 
        id: "zip-hd-preparation", 
        duration: 10000
      });
      
      // Call the Edge Function to generate the HD ZIP file
      const { data, error } = await supabase.functions.invoke('generate-zip', {
        body: {
          images: imagesForDownload,
          userId: user.id,
          isHD: true
        }
      });
      
      toast.dismiss("zip-hd-preparation");
      
      if (error) {
        console.error("Error calling generate-zip function:", error);
        throw new Error("Erreur lors de la génération du ZIP HD");
      }
      
      console.log("Function response:", data);
      
      toast.success("Demande de téléchargement HD envoyée", {
        description: "Le ZIP HD sera disponible dans votre page Téléchargements"
      });
      
      // Ask if the user wants to navigate to the downloads page
      toast("Voir vos téléchargements ?", {
        action: {
          label: "Accéder",
          onClick: () => navigate("/downloads")
        },
        duration: 10000
      });
      
    } catch (error) {
      console.error("Error during HD ZIP request:", error);
      toast.error("Erreur lors de la préparation du téléchargement HD", {
        description: "Une erreur est survenue lors du traitement de votre demande."
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
