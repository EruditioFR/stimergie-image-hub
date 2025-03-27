import React, { useState, useEffect } from 'react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Download, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { AspectRatio } from '@/components/ui/aspect-ratio';

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
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isFullPage, setIsFullPage] = useState(true);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (image && isOpen) {
      setImageLoaded(false);
      setZoomLevel(1);
      setDragPosition({ x: 0, y: 0 });
      setIsFullscreen(false);
      setIsHovered(false);
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
        window.open(downloadUrl, '_blank');
      } else {
        console.error('Aucune URL de téléchargement disponible pour cette image');
      }
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4));
    setDragPosition({ x: 0, y: 0 });
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1);
      if (newZoom === 1) {
        setDragPosition({ x: 0, y: 0 });
      }
      return newZoom;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      setDragPosition(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleClose = () => {
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
    setIsFullPage(true);
    setImageLoaded(false);
    setIsFullscreen(false);
    setIsHovered(false);
    onClose();
  };

  const toggleFullscreen = () => {
    console.log("Toggling fullscreen mode");
    setIsFullscreen(!isFullscreen);
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
    setIsHovered(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    if (zoomLevel === 1) {
      console.log("Image clicked, opening fullscreen");
      toggleFullscreen();
    }
  };

  const handleMouseEnter = () => {
    if (zoomLevel === 1 && !isFullscreen && !isDragging) {
      setIsHovered(true);
    }
  };
  
  const handleMouseLeave = () => {
    setIsHovered(false);
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
      </div>
      
      <div className="relative rounded-md overflow-hidden flex justify-center">
        <div 
          className={`relative ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''} overflow-hidden`}
          style={{ 
            height: zoomLevel > 1 ? (isFullPage ? '75vh' : '65vh') : 'auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={(e) => {
            handleMouseUp();
            handleMouseLeave();
          }}
          onMouseEnter={handleMouseEnter}
          onClick={handleImageClick}
        >
          <img 
            src={image?.display_url || image?.url_miniature || image?.src || image?.url || ''} 
            alt={image?.title || 'Image'} 
            className={`max-w-full ${isFullPage ? 'max-h-[80vh]' : 'max-h-[70vh]'} object-contain transition-all duration-300`}
            style={{ 
              transform: isHovered 
                ? `scale(${1.1}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)` 
                : `scale(${zoomLevel}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)`,
              transformOrigin: 'center',
            }}
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
              <span className="block text-foreground font-medium">Date ajoutée</span>
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
      
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-4 top-4 z-10" 
            onClick={toggleFullscreen}
            aria-label="Fermer le mode plein écran"
          >
            <X className="h-6 w-6" />
          </Button>
          
          <div 
            className={`w-full h-full p-4 md:p-8 flex items-center justify-center relative ${zoomLevel > 1 ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseEnter={handleMouseEnter}
          >
            <img 
              src={image?.display_url || image?.url_miniature || image?.src || image?.url || ''} 
              alt={image?.title || 'Image'} 
              className="max-w-full max-h-full object-contain animate-fade-in transition-transform duration-300"
              style={{ 
                transform: `scale(${zoomLevel}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)`,
                transformOrigin: 'center',
              }}
            />
          </div>
        </div>
      )}
      
      {isFullPage ? (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
          <SheetContent side="right" className="h-screen p-0 max-w-none w-[50%] sm:max-w-none">
            <div className="h-full overflow-y-auto p-6 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 z-10" 
                onClick={handleClose}
                aria-label="Fermer le détail de l'image"
              >
                <X className="h-6 w-6" />
              </Button>
              
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
