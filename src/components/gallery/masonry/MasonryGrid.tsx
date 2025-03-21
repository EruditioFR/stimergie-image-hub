
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useImageSelection } from '@/hooks/useImageSelection';
import { useSearchParams } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useIsMobile } from '@/hooks/use-mobile';
import { preloadImages } from '@/components/LazyImage';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { MasonryColumn } from './MasonryColumn';
import { MasonryPagination } from './MasonryPagination';
import { MasonryToolbar } from './MasonryToolbar';
import { MasonryDetailModal } from './MasonryDetailModal';
import { MasonryLoading } from './MasonryLoading';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

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
  hasMorePages?: boolean;
  loadMoreImages?: () => void;
}

export function MasonryGrid({ 
  images, 
  isLoading = false, 
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  hasMorePages = false,
  loadMoreImages
}: MasonryGridProps) {
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const { user } = useAuth();
  const { selectedImages, toggleImageSelection, isImageSelected, clearSelection } = useImageSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isWidescreen = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const isUltrawide = useMediaQuery('(min-width: 1536px)');
  
  // Calculate number of columns based on screen size
  const columnCount = useMemo(() => {
    if (isUltrawide) return 5;
    if (isWidescreen) return 4;
    if (isDesktop) return 3;
    if (isTablet) return 2;
    return 3; // Sur mobile, on utilise 3 colonnes
  }, [isUltrawide, isWidescreen, isDesktop, isTablet, isMobile]);
  
  // Distribute images into columns
  const columnImages = useMemo(() => {
    const columns = Array(columnCount).fill(0).map(() => []);
    
    images.forEach((image, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(image);
    });
    
    return columns;
  }, [images, columnCount]);

  // Setup image preloading - improved to load all at once
  useEffect(() => {
    if (images.length > 0) {
      // Extract all image URLs including the current page and preload them
      const allImageUrls = images.map(img => img.src);
      
      // Use the optimized batch preloader
      preloadImages(allImageUrls);
    }
  }, [images]);
  
  // Infinite scroll reference
  const infiniteScrollRef = useInfiniteScroll(loadMoreImages, isLoading);
  
  // Image click handler - now redirects to image page instead of opening modal
  const handleImageClick = (image: any) => {
    window.open(`/images/${image.id}`, '_blank');
  };
  
  // Page change handler with smoothing
  const handlePageClick = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
      // Remonter en haut de la page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Effacer la sélection lors du changement de page
      clearSelection();
    }
  };

  // Show loading placeholder when no images
  if (isLoading && images.length === 0) {
    return <MasonryLoading columnCount={columnCount} />;
  }

  return (
    <>
      <MasonryToolbar 
        selectedImages={selectedImages}
        clearSelection={clearSelection}
        onShareDialogChange={setIsShareDialogOpen}
        images={images}
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

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center my-6">
          <LoadingSpinner size={32} />
        </div>
      )}
      
      {/* Infinite scroll sentinel element */}
      {hasMorePages && !isLoading && (
        <div ref={infiniteScrollRef} className="h-1 w-full my-4" />
      )}

      {/* Show pagination when infinite scroll is not available */}
      {!loadMoreImages && (
        <MasonryPagination
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageClick}
        />
      )}
      
      <MasonryDetailModal 
        image={null}
        isOpen={false}
        onClose={() => {}}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        selectedImages={selectedImages}
        images={images.filter(img => selectedImages.includes(img.id))}
      />
    </>
  );
}
