
import { useState } from 'react';
import { X, Download, Heart, Share2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { parseTagsString } from '@/utils/imageUtils';
import { downloadImage } from '@/utils/image/download';

interface ImageDetailModalProps {
  image: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ImageDetailModal({ image, isOpen, onClose }: ImageDetailModalProps) {
  const [liked, setLiked] = useState(false);
  const [isFullPage, setIsFullPage] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  if (!image) return null;

  const tags = typeof image.tags === 'string' ? parseTagsString(image.tags) : image.tags;

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    try {
      const downloadUrl = image.download_url || image.url;
      const filename = image.title 
        ? `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg` 
        : `image_${image.id || 'download'}.jpg`;
      
      console.log(`Downloading image: ${image.title} (${downloadUrl})`);
      await downloadImage(downloadUrl, filename);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: 'Échec du téléchargement',
        description: 'Une erreur s\'est produite lors du téléchargement de l\'image.',
        variant: 'destructive'
      });
    } finally {
      setIsDownloading(false);
    }
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
  
  const toggleFullPage = () => {
    setIsFullPage(!isFullPage);
  };
  
  const handleModalClose = () => {
    setIsFullPage(false);
    onClose();
  };

  const ImageContent = () => (
    <div className="p-6 md:p-10">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-2xl font-bold">{image.title}</h2>
            {!isFullPage && (
              <Button
                variant="outline"
                size="icon"
                onClick={toggleFullPage}
                className="ml-2"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div 
            className="rounded-xl overflow-hidden shadow-lg bg-card flex justify-center relative"
          >
            <div className="relative w-full">
              <img 
                src={image.display_url || image.url} 
                alt={image.title} 
                className="max-w-full max-h-[65vh] object-contain"
              />
            </div>
          </div>

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
                <span className="block text-foreground font-medium">Date d'ajout</span>
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

        <div className="lg:col-span-2 space-y-6">
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
  );

  return (
    <>
      {isFullPage ? (
        <Sheet open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
          <SheetContent side="right" className="h-screen p-0 max-w-none w-[50%] sm:max-w-none">
            <div className="h-full overflow-y-auto relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute right-4 top-4 z-10 text-foreground" 
                onClick={handleModalClose}
              >
                <X className="h-6 w-6" />
              </Button>
              
              <div className="max-w-7xl mx-auto">
                <ImageContent />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
          <DialogContent className="w-[50%] max-h-[90vh] p-0 overflow-auto">
            <DialogTitle className="sr-only">{image.title}</DialogTitle>
            <ImageContent />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
