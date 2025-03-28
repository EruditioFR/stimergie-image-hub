
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ImageContent } from './ImageContent';

interface DetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  image: any;
  imageDimensions: { width: number; height: number };
  modalClass: string;
  modalWidth: string;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const DetailDialog = ({ 
  isOpen, 
  onClose, 
  image, 
  imageDimensions,
  modalClass,
  modalWidth,
  onImageLoad
}: DetailDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={`${modalClass} overflow-y-auto`}
        style={{ 
          width: modalWidth, 
          maxHeight: '90vh',
          padding: '24px'
        }}
      >
        <DialogTitle className="sr-only">{image?.title || 'Détail de l\'image'}</DialogTitle>
        <ImageContent 
          image={image} 
          imageDimensions={imageDimensions} 
          isFullPage={false}
          onImageLoad={onImageLoad}
        />
      </DialogContent>
    </Dialog>
  );
};
