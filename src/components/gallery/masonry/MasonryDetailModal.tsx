
import React, { useState, useEffect } from 'react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { downloadImage } from '@/utils/image/imageDownloader';

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

  const handleDownload = () => {
    if (image) {
      const downloadUrl = image.download_url || image.url_miniature || image.src || image.url;
      if (downloadUrl) {
        const filename = image.title ? `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg` : `image_${image.id}.jpg`;
        downloadImage(downloadUrl, filename);
      } else {
        console.error('Aucune URL de téléchargement disponible pour cette image');
      }
    }
  };

  const handleClose = () => {
    setIsFullPage(true);
    setImageLoaded(false);
    onClose();
  };

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

  const ImageContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{image?.title || 'Sans titre'}</h2>
        <Button 
          onClick={handleDownload}
          size="sm"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          <span>Télécharger</span>
        </Button>
      </div>
      
      <div className="relative rounded-md overflow-hidden flex justify-center">
        <div 
          className="relative"
          style={{ 
            overflow: 'hidden', 
            height: 'auto'
          }}
        >
          <img 
            src={image?.display_url || image?.url_miniature || image?.src || image?.url || ''} 
            alt={image?.title || 'Image'} 
            className={`max-w-full ${isFullPage ? 'max-h-[80vh]' : 'max-h-[70vh]'} object-contain`}
            onLoad={handleImageLoad}
            onError={(e) => {
              console.error('Erreur de chargement d\'image:', e, image);
              const imgElement = e.target as HTMLImageElement;
              const currentSrc = imgElement.src;
              if (currentSrc === image?.display_url && image?.url_miniature) {
                imgElement.src = image.url_miniature;
              } else if (currentSrc === image?.url_miniature && image?.url) {
                imgElement.src = image.url;
              }
            }}
          />
        </div>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-2">
          {image?.tags && image.tags.map((tag: string, index: number) => (
            <span 
              key={index}
              className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>
            <span className="block text-foreground font-medium">Dimensions</span>
            <span>{imageDimensions.width || image?.width || '–'} × {imageDimensions.height || image?.height || '–'}</span>
          </div>
          {image?.orientation && (
            <div>
              <span className="block text-foreground font-medium">Orientation</span>
              <span className="capitalize">{image.orientation}</span>
            </div>
          )}
          {image?.created_at && (
            <div>
              <span className="block text-foreground font-medium">Date d'ajout</span>
              <span>{new Date(image.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
        
        {image?.description && (
          <div>
            <span className="block text-foreground font-medium">Description</span>
            <p className="text-muted-foreground">{image.description}</p>
          </div>
        )}
      </div>
    </div>
  );

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

  return (
    <>
      <CreateAlbumDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        selectedImageIds={selectedImages}
        selectedImages={images}
      />
      
      {isFullPage ? (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent side="right" className="h-screen p-0 max-w-none w-[50%] sm:max-w-none">
            <div className="h-full overflow-y-auto p-6 relative">
              <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleClose}
                  aria-label="Fermer le détail de l'image"
                  className="text-foreground border-none hover:border-none focus:border-none active:border-none ring-0 hover:ring-0 focus:ring-0"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
              
              <div className="max-w-6xl mx-auto pt-8">
                <ImageContent />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent 
            className={`${modalClass} overflow-y-auto`}
            style={{ 
              width: modalWidth, 
              maxHeight: '90vh',
              padding: '24px'
            }}
          >
            <DialogTitle className="sr-only">{image?.title || 'Détail de l\'image'}</DialogTitle>
            <ImageContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
