
import React, { useState } from 'react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Download, ZoomIn, ZoomOut, X, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';

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
  // État pour gérer le niveau de zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isFullPage, setIsFullPage] = useState(true); // Afficher en mode plein écran par défaut
  
  // Fonction pour télécharger l'image
  const handleDownload = () => {
    if (image && (image.url_miniature || image.src || image.url)) {
      window.open(image.url_miniature || image.src || image.url, '_blank');
    }
  };

  // Fonctions pour gérer le zoom
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 4)); // Limite le zoom à 4x
    setDragPosition({ x: 0, y: 0 }); // Réinitialise la position
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => {
      const newZoom = Math.max(prev - 0.5, 1); // Ne descend pas en dessous de 1x
      if (newZoom === 1) {
        setDragPosition({ x: 0, y: 0 }); // Réinitialise la position au zoom minimal
      }
      return newZoom;
    });
  };
  
  // Gestion du déplacement de l'image zoomée
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
  
  // Désactive le zoom lors de la fermeture de la modale
  const handleClose = () => {
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
    setIsFullPage(true); // Réinitialise à plein écran pour la prochaine ouverture
    onClose();
  };

  const toggleFullPage = () => {
    setIsFullPage(!isFullPage);
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
  };

  // If the modal is open but no image is selected, don't render the content
  if (!image && isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent>
          <p>Aucune image sélectionnée</p>
        </DialogContent>
      </Dialog>
    );
  }

  // If the modal is not open, just render the album dialog
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

  // Rendering component for the image and zoom controls
  const ImageContent = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{image?.title || 'Sans titre'}</h2>
        {isFullPage && (
          <Button
            variant="outline"
            size="icon"
            onClick={toggleFullPage}
            className="ml-auto"
          >
            <Minimize2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="relative rounded-md overflow-hidden flex justify-center">
        <div 
          className={`relative ${zoomLevel > 1 ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
          style={{ 
            overflow: 'hidden', 
            height: zoomLevel > 1 ? (isFullPage ? '75vh' : '65vh') : 'auto'
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img 
            src={image?.url_miniature || image?.src || image?.url || ''} 
            alt={image?.title || 'Image'} 
            className={`max-w-full ${isFullPage ? 'max-h-[80vh]' : 'max-h-[70vh]'} object-contain transition-transform duration-200`}
            style={{ 
              transform: `scale(${zoomLevel}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)`,
              transformOrigin: 'center',
            }}
          />
        </div>
        
        {/* Contrôles de zoom */}
        <div className="absolute bottom-3 right-3 flex gap-2">
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={handleZoomOut} 
            disabled={zoomLevel <= 1}
            className="bg-background/80 hover:bg-background"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={handleZoomIn} 
            disabled={zoomLevel >= 4}
            className="bg-background/80 hover:bg-background"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
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
            <span>{image?.width || '–'} × {image?.height || '–'}</span>
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
          <SheetContent side="bottom" className="h-screen p-0 max-w-none w-full sm:max-w-none">
            <div className="h-full overflow-y-auto p-6 relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 z-10" 
                onClick={handleClose}
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogTitle className="sr-only">{image?.title || 'Détail de l\'image'}</DialogTitle>
            <ImageContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
