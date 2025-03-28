
import React, { useState, useEffect } from 'react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { DetailSheet } from './detail/DetailSheet';
import { DetailDialog } from './detail/DetailDialog';

interface MasonryDetailModalProps {
  image: any;
  isOpen: boolean;
  onClose: () => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: (isOpen: boolean) => void;
  selectedImages: string[];
  images: any[];
}

export function MasonryDetailModal({
  image,
  isOpen,
  onClose,
  isShareDialogOpen,
  setIsShareDialogOpen,
  selectedImages,
  images
}: MasonryDetailModalProps) {
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullPage, setIsFullPage] = useState(true);

  useEffect(() => {
    if (image && isOpen) {
      setImageLoaded(false);
    }
  }, [image, isOpen]);

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageDimensions({
      width: img.naturalWidth,
      height: img.naturalHeight
    });
    setImageLoaded(true);
  };

  const handleClose = () => {
    setIsFullPage(true);
    setImageLoaded(false);
    onClose();
  };

  // Calculate modal dimensions based on image aspect ratio
  let modalWidth = 'auto';
  let modalClass = '';
  if (imageLoaded && imageDimensions.width > 0) {
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    
    if (aspectRatio > 1.5) {
      modalWidth = `min(90vw, ${Math.min(imageDimensions.width + 120, 1200)}px)`;
      modalClass = 'wide-image';
    } else if (aspectRatio < 0.7) {
      modalWidth = `min(70vw, ${Math.min(imageDimensions.width + 120, 800)}px)`;
      modalClass = 'tall-image';
    } else {
      modalWidth = `min(80vw, ${Math.min(imageDimensions.width + 120, 1000)}px)`;
      modalClass = 'square-image';
    }
  }

  if (!image && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <DialogTitle className="sr-only">Aucune image</DialogTitle>
          <p>Aucune image sélectionnée</p>
        </DialogContent>
      </Dialog>
    );
  }

  if (!isOpen) {
    return (
      <CreateAlbumDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        selectedImageIds={selectedImages}
        selectedImages={images}
      />
    );
  }

  return (
    <>
      <CreateAlbumDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        selectedImageIds={selectedImages}
        selectedImages={images}
      />
      
      {isFullPage ? (
        <DetailSheet
          isOpen={isOpen}
          onClose={handleClose}
          image={image}
          imageDimensions={imageDimensions}
          onImageLoad={handleImageLoad}
        />
      ) : (
        <DetailDialog
          isOpen={isOpen}
          onClose={handleClose}
          image={image}
          imageDimensions={imageDimensions}
          modalClass={modalClass}
          modalWidth={modalWidth}
          onImageLoad={handleImageLoad}
        />
      )}
    </>
  );
}
