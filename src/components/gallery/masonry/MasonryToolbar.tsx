
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import { toast } from 'sonner';
import { downloadImagesAsZip } from '@/utils/image/imageDownloader';
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
    toast.loading("Préparation du ZIP en cours, veuillez patienter...", {
      duration: 60000, // Notification peut rester affichée jusqu'à 1 minute
      id: "zip-preparation"
    });
    
    const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
    console.log("Selected images for download:", selectedImagesData);
    
    // Create array with the format expected by downloadImagesAsZip
    // Make sure to use the highest quality image URL available
    const imagesForDownload = selectedImagesData.map(img => ({
      url: img.download_url || img.url || img.src,
      title: img.title || `image_${img.id}`,
      id: img.id
    }));
    
    console.log("Images prepared for ZIP download:", imagesForDownload);
    
    try {
      await downloadImagesAsZip(imagesForDownload, "images_haute_resolution.zip");
      toast.dismiss("zip-preparation");
      toast.success("Téléchargement terminé avec succès");
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
          className="ml-2"
        >
          Désélectionner tout
        </Button>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2"
        >
          {isDownloading ? (
            <>
              <LoadingSpinner size={16} className="mr-1" /> 
              Création du ZIP...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" /> Télécharger ({selectedImages.length})
            </>
          )}
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={openShareDialog}
          className="flex items-center gap-2"
        >
          <Share className="h-4 w-4" /> Partager
        </Button>
      </div>
    </div>
  );
}
