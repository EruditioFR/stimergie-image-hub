
import { useState } from 'react';
import { X, Download, Heart, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { LazyImage } from '@/components/LazyImage';
import { ImageGallery } from '@/components/ImageGallery';
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
          <div className="w-full h-full p-4 md:p-8 flex items-center justify-center">
            <img 
              src={image.url} 
              alt={image.title} 
              className="max-w-full max-h-full object-contain animate-fade-in" 
            />
          </div>
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh] p-0 overflow-auto">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute top-4 right-4 z-10"
            onClick={onClose}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="p-6 md:p-10">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
              {/* Main Image Section */}
              <div className="lg:col-span-3 space-y-6">
                <div 
                  className="rounded-xl overflow-hidden cursor-zoom-in shadow-lg bg-card"
                  onClick={toggleFullscreen}
                >
                  <LazyImage 
                    src={image.url_miniature || image.url} 
                    alt={image.title} 
                    className="w-full aspect-auto"
                    aspectRatio="aspect-auto"
                  />
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

                {/* Image Information */}
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

              {/* Sidebar with Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Author Information */}
                <div className="bg-card rounded-xl p-6 shadow-sm">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xl font-medium">U</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Utilisateur</h3>
                      <p className="text-sm text-muted-foreground">Contributeur</p>
                    </div>
                  </div>
                </div>

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

            {/* Related Images */}
            <div className="mt-20">
              <ImageGallery 
                title="Images similaires" 
                subtitle="Découvrez d'autres images qui pourraient vous intéresser"
                limit={3}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
