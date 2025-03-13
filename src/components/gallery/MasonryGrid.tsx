
import React, { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { SelectionToolbar } from '@/components/gallery/SelectionToolbar';
import { MasonryColumn } from '@/components/gallery/MasonryColumn';
import { ImageCard } from '@/components/ImageCard';
import { useImageSelection } from '@/hooks/useImageSelection';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { downloadImages } from '@/utils/imageDownloader';

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
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
  const { user } = useAuth();
  const { selectedImages, toggleImageSelection, isImageSelected, clearSelection } = useImageSelection();
  
  useInfiniteScroll(onLoadMore, isLoading);
  
  const getColumnImages = (columnIndex: number, columnCount: number) => {
    return images.filter((_, index) => index % columnCount === columnIndex);
  };

  const handleDownload = async () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
    console.log("Images sélectionnées pour téléchargement:", selectedImagesData);
    
    // Logs supplémentaires pour déboguer
    console.log("URLs des images à télécharger:");
    selectedImagesData.forEach((img, index) => {
      console.log(`Image ${index+1}: ${img.src}`);
    });
    
    await downloadImages(selectedImagesData);
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

  useEffect(() => {
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
      <SelectionToolbar 
        selectedCount={selectedImages.length}
        onClearSelection={clearSelection}
        onDownload={handleDownload}
        onShare={openShareDialog}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-1 md:gap-2">
        <MasonryColumn 
          images={getColumnImages(0, 3)} 
          isImageSelected={isImageSelected}
          toggleImageSelection={toggleImageSelection}
        />
        
        <MasonryColumn 
          images={getColumnImages(1, 3)} 
          isImageSelected={isImageSelected}
          toggleImageSelection={toggleImageSelection}
        />
        
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
