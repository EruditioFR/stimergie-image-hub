
import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ImageContent } from './ImageContent';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        className={`${modalClass} overflow-hidden`}
        style={{ 
          width: modalWidth, 
          maxHeight: '90vh',
          padding: '0'
        }}
      >
        <DialogTitle className="sr-only">{image?.title || 'Détail de l\'image'}</DialogTitle>
        <ScrollArea className="max-h-[90vh] px-6 py-6">
          <ImageContent 
            image={image} 
            imageDimensions={imageDimensions} 
            isFullPage={false}
            onImageLoad={onImageLoad}
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
