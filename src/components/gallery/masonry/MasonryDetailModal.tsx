
import React from 'react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, Download } from 'lucide-react';
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
  // Fonction pour télécharger l'image
  const handleDownload = () => {
    if (image && (image.url_miniature || image.src || image.url)) {
      window.open(image.url_miniature || image.src || image.url, '_blank');
    }
  };

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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">{image.title}</DialogTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-4 top-4 z-10" 
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="space-y-4">
              <h2 className="text-xl font-bold">{image.title}</h2>
              
              <div className="relative rounded-md overflow-hidden flex justify-center">
                <img 
                  src={image.url_miniature || image.src || image.url} 
                  alt={image.title} 
                  className="max-w-full max-h-[70vh] object-contain"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex flex-wrap gap-2">
                  {image.tags && image.tags.map((tag: string, index: number) => (
                    <span 
                      key={index}
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                
                <Button 
                  onClick={handleDownload}
                  className="ml-auto"
                  variant="default"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Télécharger
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
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
                
                {image.description && (
                  <div>
                    <span className="block text-foreground font-medium">Description</span>
                    <p className="text-muted-foreground">{image.description}</p>
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
