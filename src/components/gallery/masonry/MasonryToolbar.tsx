
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import { toast } from 'sonner';
import { downloadImages } from '@/utils/image';
import { Image } from '@/utils/image/types';

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
  if (selectedImages.length === 0) return null;

  const handleDownload = async () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
    await downloadImages(selectedImagesData);
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
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" /> Télécharger ({selectedImages.length})
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
