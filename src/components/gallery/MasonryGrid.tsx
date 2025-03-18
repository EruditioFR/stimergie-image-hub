
import React, { useEffect, useState, useMemo, useCallback } from 'react';
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
import { preloadImages, clearOffscreenImagesFromCache } from '@/components/LazyImage';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

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
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  onLoadMore?: () => void;
}

export function MasonryGrid({ 
  images, 
  isLoading = false, 
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  onLoadMore 
}: MasonryGridProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);
  const [selectedImageDetail, setSelectedImageDetail] = useState<any>(null);
  const [isImageDetailOpen, setIsImageDetailOpen] = useState(false);
  const [visibleImageRange, setVisibleImageRange] = useState({ start: 0, end: 20 });
  const { user } = useAuth();
  const { selectedImages, toggleImageSelection, isImageSelected, clearSelection } = useImageSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isWidescreen = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const isUltrawide = useMediaQuery('(min-width: 1536px)');

  // On utilise useInfiniteScroll seulement si onLoadMore est fourni
  if (onLoadMore) {
    useInfiniteScroll(onLoadMore, isLoading);
  }
  
  const columnCount = useMemo(() => {
    if (isUltrawide) return 5;
    if (isWidescreen) return 4;
    if (isDesktop) return 3;
    if (isTablet) return 2;
    return 3; // Sur mobile, on utilise maintenant 3 colonnes
  }, [isUltrawide, isWidescreen, isDesktop, isTablet, isMobile]);
  
  const columnImages = useMemo(() => {
    const columns = Array(columnCount).fill(0).map(() => []);
    
    images.forEach((image, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(image);
    });
    
    return columns;
  }, [images, columnCount]);

  const imagesPerPage = 15;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / imagesPerPage) : 0;
  
  const handleScroll = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    
    const visibleStart = Math.max(0, Math.floor((scrollTop - 1000) / 300) * columnCount);
    const visibleEnd = Math.min(
      images.length, 
      Math.ceil((scrollTop + windowHeight + 1000) / 300) * columnCount
    );
    
    setVisibleImageRange({ start: visibleStart, end: visibleEnd });
    
    if (images.length > visibleEnd) {
      const nextBatchImages = images.slice(visibleEnd, visibleEnd + columnCount * 5);
      if (nextBatchImages.length > 0) {
        preloadImages(nextBatchImages.map(img => img.src));
      }
    }
    
    if (images.length > 50) {
      const visibleImages = images.slice(visibleStart, visibleEnd);
      clearOffscreenImagesFromCache(visibleImages.map(img => img.src));
    }
  }, [images, columnCount]);
  
  useEffect(() => {
    if (images.length > 0) {
      const preloadImagesInBatches = () => {
        const initialBatch = images.slice(0, 12).map(img => img.src);
        preloadImages(initialBatch);
        
        if (images.length > 12) {
          setTimeout(() => {
            if (document.visibilityState === 'visible') {
              const nextBatch = images.slice(12, 24).map(img => img.src);
              preloadImages(nextBatch);
            }
          }, 500);
          
          if (images.length > 24) {
            setTimeout(() => {
              if (document.visibilityState === 'visible') {
                const laterBatch = images.slice(24, 36).map(img => img.src);
                preloadImages(laterBatch);
              }
            }, 1500);
          }
        }
      };
      
      preloadImagesInBatches();
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [images, handleScroll]);
  
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

  const handlePageClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      // Remonter en haut de la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Effacer la sélection lors du changement de page
      clearSelection();
    }
  };

  if (isLoading && images.length === 0) {
    return (
      <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-0.5 animate-pulse px-0.5">
        {Array.from({ length: columnCount * 2 }).map((_, index) => (
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

      <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-0.5 px-0.5">
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

      {/* Ajout de la pagination */}
      {totalPages > 0 && onPageChange && (
        <div className="mt-8 mb-6">
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageClick(currentPage - 1)} />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                let pageNumber;
                
                // Logique pour afficher les bons numéros de page
                if (totalPages <= 5) {
                  // Si on a 5 pages ou moins, on les affiche toutes
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  // Si on est au début, on affiche 1, 2, 3, 4, 5
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  // Si on est à la fin, on affiche les 5 dernières pages
                  pageNumber = totalPages - 4 + i;
                } else {
                  // Sinon on affiche 2 pages avant et 2 pages après la page actuelle
                  pageNumber = currentPage - 2 + i;
                }
                
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink
                      isActive={pageNumber === currentPage}
                      onClick={() => handlePageClick(pageNumber)}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageClick(currentPage + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
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
