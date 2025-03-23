
import { useState } from 'react';
import { X, Download, Heart, Share2, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { LazyImage } from '@/components/LazyImage';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { parseTagsString } from '@/utils/imageUtils';

interface ImageDetailModalProps {
  image: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageDetailModal({ image, isOpen, onClose }: ImageDetailModalProps) {
  const [liked, setLiked] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { toast } = useToast();
  
  // État pour gérer le zoom
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  if (!image) return null;

  // Parse tags if they're stored as a string
  const tags = typeof image.tags === 'string' ? parseTagsString(image.tags) : image.tags;

  const handleDownload = () => {
    window.open(image.url, '_blank');
  };

  const handleLike = () => {
    setLiked(!liked);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Lien copié',
      description: 'Lien copié dans le presse-papier'
    });
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Réinitialiser le zoom quand on entre/sort du mode plein écran
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
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
  const handleModalClose = () => {
    setZoomLevel(1);
    setDragPosition({ x: 0, y: 0 });
    onClose();
  };

  return (
    <>
      {/* Fullscreen Image View */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center animate-fade-in">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 text-foreground z-10"
            onClick={toggleFullscreen}
          >
            <X className="h-6 w-6" />
          </Button>
          <div 
            className={`w-full h-full p-4 md:p-8 flex items-center justify-center relative ${zoomLevel > 1 ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <img 
              src={image.url} 
              alt={image.title} 
              className="max-w-full max-h-full object-contain animate-fade-in transition-transform duration-200"
              style={{ 
                transform: `scale(${zoomLevel}) translate(${dragPosition.x / zoomLevel}px, ${dragPosition.y / zoomLevel}px)`,
                transformOrigin: 'center',
              }}
            />
            
            {/* Contrôles de zoom en plein écran */}
            <div className="absolute bottom-8 right-8 flex gap-2">
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
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] p-0 overflow-auto">
          {/* Ajout d'un DialogTitle caché pour l'accessibilité */}
          <DialogTitle className="sr-only">{image.title}</DialogTitle>

          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Main Image Section - Now showing the image first before any text */}
              <div className="lg:col-span-3 space-y-6">
                {/* Image displayed first with original ratio */}
                <div 
                  className="rounded-xl overflow-hidden shadow-lg bg-card flex justify-center relative"
                >
                  <div 
                    className={`relative ${zoomLevel > 1 ? 'cursor-grab' : 'cursor-zoom-in'} ${isDragging ? 'cursor-grabbing' : ''}`}
                    style={{ 
                      overflow: 'hidden', 
                      height: zoomLevel > 1 ? '65vh' : 'auto',
                      width: '100%'
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onClick={zoomLevel === 1 ? toggleFullscreen : undefined}
                  >
                    <LazyImage 
                      src={image.url} 
                      alt={image.title} 
                      className="max-w-full max-h-[65vh] object-contain transition-transform duration-200"
                      aspectRatio="aspect-auto"
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

                {/* Mobile Action Buttons */}
                <div className="flex lg:hidden justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={handleLike}
                    >
                      <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{liked ? '1' : '0'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex items-center gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Partager</span>
                    </Button>
                  </div>
                  <Button
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger</span>
                  </Button>
                </div>

                {/* Image Information - Now after the image */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h1 className="text-2xl font-bold mb-2">{image.title}</h1>
                  <p className="text-muted-foreground mb-6">{image.description || 'Aucune description disponible'}</p>
                  
                  {tags && tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {tags.map((tag: string) => (
                        <Link 
                          key={tag} 
                          to={`/gallery?tag=${tag}`}
                          className="py-1 px-3 text-xs rounded-full bg-secondary hover:bg-secondary/80 transition-colors"
                          onClick={onClose}
                        >
                          #{tag}
                        </Link>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex flex-wrap gap-x-8 gap-y-4 text-sm text-muted-foreground">
                    <div>
                      <span className="block text-foreground font-medium">Date ajoutée</span>
                      <span>{new Date(image.created_at).toLocaleDateString('fr-FR')}</span>
                    </div>
                    <div>
                      <span className="block text-foreground font-medium">Dimensions</span>
                      <span>{image.width} × {image.height}</span>
                    </div>
                    <div>
                      <span className="block text-foreground font-medium">Orientation</span>
                      <span className="capitalize">{image.orientation}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar with Details - removing user section and thumbnail section */}
              <div className="lg:col-span-2 space-y-6">
                {/* Desktop Action Buttons */}
                <div className="hidden lg:block bg-card rounded-xl p-6 shadow-sm space-y-4">
                  <h3 className="font-medium mb-4">Actions</h3>
                  
                  <Button 
                    onClick={handleDownload}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Télécharger</span>
                  </Button>
                  
                  <div className="flex gap-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={handleLike}
                    >
                      <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                      <span>{liked ? 'Aimé' : 'J\'aime'}</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 flex items-center justify-center gap-2"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4" />
                      <span>Partager</span>
                    </Button>
                  </div>
                </div>

                {/* License Information */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <h3 className="font-medium mb-4">Informations de licence</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette image est disponible sous licence gratuite pour usage personnel et commercial.
                  </p>
                  <Link to="/licenses" className="text-sm text-primary hover:underline" onClick={onClose}>
                    En savoir plus sur nos licences
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
