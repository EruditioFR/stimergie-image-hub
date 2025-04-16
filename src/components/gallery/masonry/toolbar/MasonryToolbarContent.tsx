
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
      
      const imagesForDownload = selectedImagesData.map(img => {
        // Utiliser l'URL PNG pour le téléchargement standard
        let folderName = "";
        if (img.projets?.nom_dossier) {
          folderName = img.projets.nom_dossier;
        } else if (img.id_projet) {
          // Si nous avons l'ID du projet mais pas le dossier, on utilise un placeholder
          folderName = `project-${img.id_projet}`;
        }
        
        const imageTitle = img.title || `image-${img.id}`;
        const pngUrl = generateDownloadImageSDUrl(folderName, imageTitle);
        
        return {
          url: pngUrl,
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });

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
      
      const imagesForDownload = selectedImagesData.map(img => {
        let folderName = "";
        if (img.projets?.nom_dossier) {
          folderName = img.projets.nom_dossier;
        } else if (img.id_projet) {
          // Si nous avons l'ID du projet mais pas le dossier, on utilise un placeholder
          folderName = `project-${img.id_projet}`;
        }
        
        const imageTitle = img.title || `image-${img.id}`;
        const hdUrl = generateDownloadImageHDUrl(folderName, imageTitle);
        
        return {
          url: hdUrl || "",
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });
      
      toast.loading("Préparation du ZIP HD en cours", { 
        id: "zip-hd-preparation", 
        duration: 10000
      });
      
      const { data, error } = await supabase.functions.invoke('generate-zip', {
        body: {
          images: imagesForDownload,
          userId: user.id,
          isHD: true
        }
      });
      
      toast.dismiss("zip-hd-preparation");
      
      if (error) {
        throw new Error("Erreur lors de la génération du ZIP HD");
      }
      
      toast.success("Demande de téléchargement HD envoyée", {
        description: "Le ZIP HD sera disponible dans votre page Téléchargements"
      });
      
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
