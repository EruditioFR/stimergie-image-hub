
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
  
  // Function to split images into columns for masonry layout
  const getColumnImages = (columnIndex: number, columnCount: number) => {
    return images.filter((_, index) => index % columnCount === columnIndex);
  };

  // Toggle image selection
  const toggleImageSelection = (id: string) => {
    setSelectedImages(prev => {
      if (prev.includes(id)) {
        return prev.filter(imgId => imgId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  // Check if image is selected
  const isImageSelected = (id: string) => {
    return selectedImages.includes(id);
  };

  // Download selected images as ZIP
  const downloadSelectedImages = async () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image");
      return;
    }

    try {
      toast.info("Préparation du téléchargement...");
      
      const zip = new JSZip();
      const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
      
      // Add each selected image to the zip file
      const fetchPromises = selectedImagesData.map(async (img) => {
        try {
          const response = await fetch(img.src);
          if (!response.ok) throw new Error(`Failed to fetch ${img.src}`);
          
          const blob = await response.blob();
          // Get file extension from URL
          const extension = img.src.split('.').pop() || 'jpg';
          // Use image title or id as filename
          const filename = `${img.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${img.id}.${extension}`;
          
          zip.file(filename, blob);
          return true;
        } catch (error) {
          console.error(`Error fetching ${img.src}:`, error);
          return false;
        }
      });
      
      await Promise.all(fetchPromises);
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `images_selection_${new Date().toISOString().slice(0, 10)}.zip`);
      
      toast.success("Téléchargement prêt");
    } catch (error) {
      console.error("Error creating zip:", error);
      toast.error("Une erreur est survenue lors du téléchargement");
    }
  };

  // Open share dialog
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

  // Handle scroll for infinite loading
  const handleScroll = React.useCallback(() => {
    if (!onLoadMore) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    // Load more when user scrolls to bottom (with a 300px threshold for earlier loading)
    if (scrollHeight - scrollTop - clientHeight < 300 && !isLoading) {
      onLoadMore();
    }
  }, [onLoadMore, isLoading]);

  // Add scroll event listener with debounce
  React.useEffect(() => {
    if (onLoadMore) {
      // Debounce scroll event to improve performance
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

  // Preload initial images
  React.useEffect(() => {
    // Précharger les premières images visibles pour un affichage plus rapide
    const preloadInitialImages = () => {
      const imagesToPreload = images.slice(0, 6); // Préchargement des 6 premières images
      
      imagesToPreload.forEach(image => {
        const img = new Image();
        img.src = image.src;
      });
    };
    
    if (images.length > 0) {
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
      {/* Selection Actions Bar */}
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
        {/* First column */}
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
        
        {/* Second column */}
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
        
        {/* Third column */}
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

      {/* Loading indicator for infinite scroll */}
      {isLoading && images.length > 0 && (
        <div className="flex justify-center mt-6">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Share dialog */}
      <CreateAlbumDialog 
        isOpen={isShareDialogOpen}
        onOpenChange={setIsShareDialogOpen}
        selectedImageIds={selectedImages}
        selectedImages={images.filter(img => selectedImages.includes(img.id))}
      />
    </>
  );
}
