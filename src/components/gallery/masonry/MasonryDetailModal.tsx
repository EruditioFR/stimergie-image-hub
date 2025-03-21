
import React from 'react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
  return (
    <>
      <CreateAlbumDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        selectedImageIds={selectedImages}
        selectedImages={images}
      />
      
      {image && (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <DialogContent className="max-w-4xl">
            <DialogTitle className="sr-only">{image.title}</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{image.title}</h2>
              
              <div className="relative rounded-md overflow-hidden">
                <img 
                  src={image.url_miniature || image.src || image.url} 
                  alt={image.title} 
                  className="w-full h-auto object-contain"
                />
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div>
                  <span className="block text-foreground font-medium">Dimensions</span>
                  <span>{image.width || '–'} × {image.height || '–'}</span>
                </div>
                {image.orientation && (
                  <div>
                    <span className="block text-foreground font-medium">Orientation</span>
                    <span className="capitalize">{image.orientation}</span>
                  </div>
                )}
                {image.created_at && (
                  <div>
                    <span className="block text-foreground font-medium">Date ajoutée</span>
                    <span>{new Date(image.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
