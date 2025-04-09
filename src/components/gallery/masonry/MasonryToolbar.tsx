
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { downloadImagesAsZip } from '@/utils/image/download';
import { Image } from '@/utils/image/types';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface MasonryToolbarProps {
  selectedImages: string[];
  clearSelection: () => void;
  onShareDialogChange: (isOpen: boolean) => void;
  images: Image[];
}

export function MasonryToolbar({
  selectedImages,
  clearSelection,
  onShareDialogChange,
  images
}: MasonryToolbarProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingHD, setIsDownloadingHD] = useState(false);

  if (selectedImages.length === 0) return null;

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
    
    // Notification courte au démarrage
    toast.loading("Préparation du téléchargement...", {
      id: "zip-preparation" 
    });
    
    try {
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      
      // Créer un tableau avec les formats attendus par downloadImagesAsZip
      // MODIFICATION: Utiliser UNIQUEMENT le champ 'url' de la table images
      const imagesForDownload = selectedImagesData.map(img => {
        // Utiliser UNIQUEMENT le champ url
        const url = img.url;
        
        return {
          url: url,
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });
      
      await downloadImagesAsZip(imagesForDownload, "images_stimergie.zip");
      // La fonction de téléchargement gère ses propres notifications
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
    
    // Notification courte au démarrage
    toast.loading("Préparation du téléchargement HD...", {
      id: "zip-hd-preparation"
    });
    
    try {
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      
      // MODIFICATION: Utiliser UNIQUEMENT le champ 'url' de la table images pour la version HD également
      const imagesForDownload = selectedImagesData.map(img => {
        // Toujours utiliser uniquement le champ URL
        const url = img.url;
        
        return {
          url: url,
          title: img.title || `image_${img.id}`,
          id: img.id
        };
      });
      
      await downloadImagesAsZip(imagesForDownload, "images_hd_stimergie.zip");
      // La fonction de téléchargement gère ses propres notifications
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
    // We would normally check for user here, but we're extracting the component
    // so we'll assume that's been checked before
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image");
      return;
    }
    
    onShareDialogChange(true);
  };

  return (
    <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm p-4 mb-4 rounded-lg border shadow-sm flex items-center justify-between">
      <div>
        <span className="font-medium">{selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} sélectionnée{selectedImages.length > 1 ? 's' : ''}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={clearSelection}
          className="ml-2 py-4"
        >
          Désélectionner tout
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 py-4"
        >
          {isDownloading ? (
            <>
              <LoadingSpinner size={16} className="mr-1" /> 
              Création du ZIP...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <div className="hidden md:flex flex-col items-center">
                <span>Version web & réseaux sociaux</span>
                <span className="text-xs text-muted-foreground">({"< 2 Mo"})</span>
              </div>
              <span className="md:hidden">Télécharger</span>
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownloadHD}
          disabled={isDownloadingHD}
          className="flex items-center gap-2 py-4"
        >
          {isDownloadingHD ? (
            <>
              <LoadingSpinner size={16} className="mr-1" /> 
              Création du ZIP HD...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <div className="hidden md:flex flex-col items-center">
                <span>Version HD impression</span>
                <span className="text-xs text-muted-foreground">({">"} 20 Mo)</span>
              </div>
              <span className="md:hidden">HD</span>
            </>
          )}
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={openShareDialog}
          className="flex items-center gap-2 py-4"
        >
          <Share className="h-4 w-4" /> Partager
        </Button>
      </div>
    </div>
  );
}
