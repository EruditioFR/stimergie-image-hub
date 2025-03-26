
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
  const [selectedImageDetail, setSelectedImageDetail] = useState<any>(null);
  const [isImageDetailOpen, setIsImageDetailOpen] = useState(false);
  const { user } = useAuth();
  const { selectedImages, toggleImageSelection, isImageSelected, clearSelection } = useImageSelection();
  const [searchParams] = useSearchParams();
  
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isWidescreen = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const isUltrawide = useMediaQuery('(min-width: 1536px)');
  
  // Calculate column count based on screen size
  const columnCount = useMemo(() => {
    if (isMobile) return 2; // Reduce columns on mobile for faster rendering
    if (isTablet) return 2;
    if (isDesktop) return 3;
    if (isWidescreen) return 4;
    if (isUltrawide) return 5;
    return 3;
  }, [isUltrawide, isWidescreen, isDesktop, isTablet, isMobile]);
  
  // Distribute images efficiently across columns
  const columnImages = useMemo(() => {
    const columns = Array(columnCount).fill(0).map(() => []);
    
    // Use a height-balanced approach for better visual layout
    const columnHeights = Array(columnCount).fill(0);
    
    images.forEach((image) => {
      // Find the shortest column
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      // Add image to shortest column
      columns[shortestColumnIndex].push(image);
      
      // Update column height estimation
      const heightFactor = image.orientation === 'portrait' ? 1.33 : 
                          image.orientation === 'landscape' ? 0.75 : 1;
      columnHeights[shortestColumnIndex] += heightFactor;
    });
    
    return columns;
  }, [images, columnCount]);

  // Enhanced image preloading
  useEffect(() => {
    if (images.length > 0 && !isLoading) {
      // First preload visible images (first 12 images)
      const visibleImageUrls = images.slice(0, 12).map(img => img.src);
      
      // Immediately preload visible images
      preloadImages(visibleImageUrls);
      
      // Then preload the rest with a slight delay
      if (images.length > 12) {
        const remainingUrls = images.slice(12).map(img => img.src);
        setTimeout(() => preloadImages(remainingUrls), 1000);
      }
    }
  }, [images, isLoading]);
  
  // Infinite scroll reference
  const infiniteScrollRef = useInfiniteScroll(loadMoreImages, isLoading);
  
  // Image click handler
  const handleImageClick = useCallback((image: any) => {
    setSelectedImageDetail(image);
    setIsImageDetailOpen(true);
  }, []);
  
  // Modal close handler
  const handleCloseImageDetail = useCallback(() => {
    setIsImageDetailOpen(false);
    setSelectedImageDetail(null);
  }, []);

  // Page change handler with smooth scroll
  const handlePageClick = useCallback((page: number) => {
    if (onPageChange && !isLoading) {
      clearSelection();
      onPageChange(page);
      
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onPageChange, clearSelection, isLoading]);

  // Loading placeholder
  if (isLoading && images.length === 0) {
    return <MasonryLoading columnCount={columnCount} />;
  }

  // Pagination mode detection
  const isPaginationMode = !loadMoreImages;

  return (
    <>
      <MasonryToolbar 
        selectedImages={selectedImages}
        clearSelection={clearSelection}
        onShareDialogChange={setIsShareDialogOpen}
        images={images}
      />

      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-0.5 px-0.5">
        {columnImages.map((columnImages, columnIndex) => (
          <MasonryColumn 
            key={columnIndex}
            images={columnImages} 
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
      
      {/* Infinite scroll sentinel */}
      {!isPaginationMode && hasMorePages && !isLoading && loadMoreImages && (
        <div ref={infiniteScrollRef} className="h-1 w-full my-4" />
      )}

      {/* Pagination controls */}
      {isPaginationMode && (
        <MasonryPagination
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageClick}
          isLoading={isLoading}
        />
      )}
      
      <MasonryDetailModal 
        image={selectedImageDetail}
        isOpen={isImageDetailOpen}
        onClose={handleCloseImageDetail}
        isShareDialogOpen={isShareDialogOpen}
        setIsShareDialogOpen={setIsShareDialogOpen}
        selectedImages={selectedImages}
        images={images.filter(img => selectedImages.includes(img.id))}
      />
    </>
  );
}
