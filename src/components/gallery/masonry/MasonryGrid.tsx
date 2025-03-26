
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
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
  const progressiveLoadRef = useRef<boolean>(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isWidescreen = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const isUltrawide = useMediaQuery('(min-width: 1536px)');
  
  // Calculate column count based on screen size and connection speed
  const columnCount = useMemo(() => {
    // Use connection information to further optimize columns if available
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && 
      (connection.effectiveType === '2g' || connection.effectiveType === 'slow-2g');
    
    if (isSlowConnection && isMobile) return 1; // Extra reduction for slow connections
    if (isMobile) return 2;
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

  // Enhanced image preloading with 3-tier priority system
  useEffect(() => {
    if (images.length > 0 && !isLoading) {
      // Set a flag to avoid re-triggering this effect when it's already running
      if (progressiveLoadRef.current) return;
      progressiveLoadRef.current = true;
      
      // First tier: Visible images (high priority)
      const firstTierCount = Math.min(6, images.length);
      const firstTier = images.slice(0, firstTierCount).map(img => img.src);
      
      // Second tier: Images likely to become visible soon (medium priority)
      const secondTierCount = Math.min(16, images.length) - firstTierCount;
      const secondTier = secondTierCount > 0 
        ? images.slice(firstTierCount, firstTierCount + secondTierCount).map(img => img.src)
        : [];
        
      // Third tier: Remaining images (low priority)
      const thirdTier = images.length > (firstTierCount + secondTierCount)
        ? images.slice(firstTierCount + secondTierCount).map(img => img.src)
        : [];
      
      // Preload with priority levels (1 = highest, 3 = lowest)
      preloadImages(firstTier, 1);
      
      if (secondTier.length > 0) {
        setTimeout(() => {
          preloadImages(secondTier, 2);
        }, 300);
      }
      
      if (thirdTier.length > 0) {
        setTimeout(() => {
          // Load in smaller chunks to avoid overwhelming the browser
          const chunkSize = 10;
          for (let i = 0; i < thirdTier.length; i += chunkSize) {
            const chunk = thirdTier.slice(i, i + chunkSize);
            setTimeout(() => {
              preloadImages(chunk, 3);
            }, i * 100); // Stagger the loading of each chunk
          }
          
          // Reset the flag after all images are processed
          progressiveLoadRef.current = false;
        }, 800);
      } else {
        // Reset the flag if there's no third tier
        progressiveLoadRef.current = false;
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
    <div ref={viewportRef}>
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
    </div>
  );
}
