import React, { useState } from 'react';
import { ImageCard } from '@/components/ImageCard';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  tags?: string[];
  orientation?: string;
}

interface MasonryGridProps {
  images: Image[];
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export function MasonryGrid({ images, isLoading = false, onLoadMore }: MasonryGridProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { user } = useAuth();
  
  const getColumnImages = (columnIndex: number, columnCount: number) => {
    return images.filter((_, index) => index % columnCount === columnIndex);
  };

  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => {
      if (prev.includes(id)) {
        return prev.filter(imgId => imgId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const isImageSelected = (id: string) => {
    return selectedImages.includes(id);
  };

  const downloadSelectedImages = async () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image");
      return;
    }

    try {
      toast.info("Préparation du téléchargement...");
      
      const zip = new JSZip();
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      
      const fetchPromises = selectedImagesData.map(async (img, index) => {
        try {
          const imageUrl = img.src;
          console.log(`Fetching image: ${imageUrl}`);
          
          const response = await fetch(imageUrl, { 
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            console.error(`Failed to fetch ${imageUrl}: ${response.status} ${response.statusText}`);
            throw new Error(`Failed to fetch ${imageUrl}`);
          }
          
          const blob = await response.blob();
          console.log(`Image fetched successfully: ${imageUrl}, size: ${blob.size} bytes`);
          
          let extension = 'jpg';
          if (blob.type) {
            extension = blob.type.split('/')[1] || 'jpg';
          } else if (imageUrl.includes('.')) {
            extension = imageUrl.split('.').pop() || 'jpg';
          }
          
          const filename = `image_${index + 1}.${extension}`;
          console.log(`Adding to zip as: ${filename}`);
          
          zip.file(filename, blob);
          return true;
        } catch (error) {
          console.error(`Error processing image ${img.src}:`, error);
          return false;
        }
      });
      
      try {
        await Promise.all(fetchPromises);
        console.log("All fetch promises completed");
        
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        });
        
        console.log(`ZIP generated, size: ${zipBlob.size} bytes`);
        
        saveAs(zipBlob, `images_selection_${new Date().toISOString().slice(0, 10)}.zip`);
        toast.success("Téléchargement prêt");
      } catch (error) {
        console.error("Error processing images:", error);
        toast.error("Certaines images n'ont pas pu être téléchargées");
      }
    } catch (error) {
      console.error("Error creating zip:", error);
      toast.error("Une erreur est survenue lors du téléchargement");
    }
  };

  const openShareDialog = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour partager des images");
      return;
    }

    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image");
      return;
    }
    
    setIsShareDialogOpen(true);
  };

  const handleScroll = React.useCallback(() => {
    if (!onLoadMore) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    if (scrollHeight - scrollTop - clientHeight < 300 && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, isLoading]);

  React.useEffect(() => {
    if (onLoadMore) {
      let scrollTimer: number | null = null;
      
      const debouncedScroll = () => {
        if (scrollTimer) window.clearTimeout(scrollTimer);
        scrollTimer = window.setTimeout(handleScroll, 100);
      };
      
      window.addEventListener('scroll', debouncedScroll);
      return () => {
        if (scrollTimer) window.clearTimeout(scrollTimer);
        window.removeEventListener('scroll', debouncedScroll);
      };
    }
  }, [onLoadMore, handleScroll]);

  React.useEffect(() => {
    if (images.length > 0) {
      const preloadInitialImages = () => {
        const imagesToPreload = images.slice(0, 6);
        
        imagesToPreload.forEach(image => {
          const img = new Image();
          img.src = image.src;
        });
      };
      
      preloadInitialImages();
    }
  }, [images]);

  if (isLoading && images.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="h-64 rounded-xl bg-muted"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      {selectedImages.length > 0 && (
        <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm p-4 mb-4 rounded-lg border shadow-sm flex items-center justify-between">
          <div>
            <span className="font-medium">{selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} sélectionnée{selectedImages.length > 1 ? 's' : ''}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSelectedImages([])}
              className="ml-2"
            >
              Désélectionner tout
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={downloadSelectedImages}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" /> Télécharger ({selectedImages.length})
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              onClick={openShareDialog}
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" /> Partager
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2">
        <div className="flex flex-col gap-1 md:gap-2">
          {getColumnImages(0, 3).map((image) => (
            <div 
              key={image.id}
              className="opacity-100 relative" 
            >
              <div 
                className={`absolute top-2 left-2 w-5 h-5 rounded-full z-10 border-2 cursor-pointer transition-colors ${
                  isImageSelected(image.id) 
                    ? 'bg-primary border-white' 
                    : 'bg-white/50 border-white/70 hover:bg-white/80'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleImageSelection(image.id);
                }}
              />
              <ImageCard 
                {...image} 
                className={`w-full transition-all ${isImageSelected(image.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                orientation={image.orientation}
              />
            </div>
          ))}
        </div>
        
        <div className="flex flex-col gap-1 md:gap-2">
          {getColumnImages(1, 3).map((image) => (
            <div 
              key={image.id} 
              className="opacity-100 relative" 
            >
              <div 
                className={`absolute top-2 left-2 w-5 h-5 rounded-full z-10 border-2 cursor-pointer transition-colors ${
                  isImageSelected(image.id) 
                    ? 'bg-primary border-white' 
                    : 'bg-white/50 border-white/70 hover:bg-white/80'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleImageSelection(image.id);
                }}
              />
              <ImageCard 
                {...image} 
                className={`w-full transition-all ${isImageSelected(image.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                orientation={image.orientation}
              />
            </div>
          ))}
        </div>
        
        <div className="hidden lg:flex flex-col gap-1 md:gap-2">
          {getColumnImages(2, 3).map((image) => (
            <div 
              key={image.id} 
              className="opacity-100 relative" 
            >
              <div 
                className={`absolute top-2 left-2 w-5 h-5 rounded-full z-10 border-2 cursor-pointer transition-colors ${
                  isImageSelected(image.id) 
                    ? 'bg-primary border-white' 
                    : 'bg-white/50 border-white/70 hover:bg-white/80'
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleImageSelection(image.id);
                }}
              />
              <ImageCard 
                {...image} 
                className={`w-full transition-all ${isImageSelected(image.id) ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                orientation={image.orientation}
              />
            </div>
          ))}
        </div>
      </div>

      {isLoading && images.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      <CreateAlbumDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        selectedImageIds={selectedImages}
        selectedImages={images.filter(img => selectedImages.includes(img.id))}
      />
    </>
  );
}
