import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';
import { SelectionToolbar } from '@/components/gallery/SelectionToolbar';
import { MasonryColumn } from '@/components/gallery/MasonryColumn';
import { ImageCard } from '@/components/ImageCard';
import { useImageSelection } from '@/hooks/useImageSelection';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { downloadImages } from '@/utils/image';
import { ImageDetailModal } from './ImageDetailModal';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { preloadImages } from '@/components/LazyImage';

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
  const [selectedImageDetail, setSelectedImageDetail] = useState<any>(null);
  const [isImageDetailOpen, setIsImageDetailOpen] = useState(false);
  const { user } = useAuth();
  const { selectedImages, toggleImageSelection, isImageSelected, clearSelection } = useImageSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  
  useInfiniteScroll(onLoadMore, isLoading);
  
  const columnCount = useMemo(() => {
    if (typeof window === 'undefined') return 3;
    return window.innerWidth >= 1536 ? 5 : 
           window.innerWidth >= 1280 ? 4 : 
           window.innerWidth >= 1024 ? 3 : 
           window.innerWidth >= 640 ? 2 : 1;
  }, []);
  
  const columnImages = useMemo(() => {
    const columns = Array(columnCount).fill(0).map(() => []);
    
    images.forEach((image, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(image);
    });
    
    return columns;
  }, [images, columnCount]);
  
  useEffect(() => {
    if (images.length > 0) {
      const preloadNextBatch = () => {
        const initialBatch = images.slice(0, 12).map(img => img.src);
        preloadImages(initialBatch);
        
        if (images.length > 12) {
          setTimeout(() => {
            const nextBatch = images.slice(12, 24).map(img => img.src);
            preloadImages(nextBatch);
          }, 500);
          
          if (images.length > 24) {
            setTimeout(() => {
              const laterBatch = images.slice(24, 36).map(img => img.src);
              preloadImages(laterBatch);
            }, 1500);
          }
        }
      };
      
      preloadNextBatch();
    }
  }, [images]);
  
  useEffect(() => {
    const imageId = searchParams.get('image');
    if (imageId) {
      const openImageDetail = async () => {
        try {
          const { data, error } = await supabase
            .from('images')
            .select('*')
            .eq('id', parseInt(imageId))
            .single();
            
          if (error) throw error;
          
          if (data) {
            setSelectedImageDetail(data);
            setIsImageDetailOpen(true);
          }
        } catch (error) {
          console.error('Error loading image details:', error);
        }
      };
      
      openImageDetail();
    }
  }, [searchParams]);

  const handleImageClick = (image: any) => {
    setSelectedImageDetail(image);
    setIsImageDetailOpen(true);
    
    searchParams.set('image', image.id);
    setSearchParams(searchParams);
  };
  
  const handleCloseImageDetail = () => {
    setIsImageDetailOpen(false);
    setSelectedImageDetail(null);
    
    searchParams.delete('image');
    setSearchParams(searchParams);
  };

  const handleDownload = async () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image à télécharger");
      return;
    }
    
    const selectedImagesData = images.filter(img => selectedImages.includes(img.id));
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
    if (images.length === 0) return;
    
    const handleScroll = () => {
      const scrollPosition = window.scrollY + window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      
      if (documentHeight - scrollPosition < 1000) {
        const visibleImages = images.slice(0, 30);
        const nextBatchImages = images.slice(30, 50);
        
        if (nextBatchImages.length > 0) {
          preloadImages(nextBatchImages.map(img => img.src));
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [images]);

  if (isLoading && images.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0.5 animate-pulse px-0.5">
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="h-64 rounded-md bg-muted"></div>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-0.5 px-0.5">
        {columnImages.map((images, columnIndex) => (
          <MasonryColumn 
            key={columnIndex}
            images={images} 
            isImageSelected={isImageSelected}
            toggleImageSelection={toggleImageSelection}
            onImageClick={handleImageClick}
          />
        ))}
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
      
      <ImageDetailModal 
        image={selectedImageDetail}
        isOpen={isImageDetailOpen}
        onClose={handleCloseImageDetail}
      />
    </>
  );
}
