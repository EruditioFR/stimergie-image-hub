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
import { Image } from '@/utils/image/types';

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
  
  const columnCount = useMemo(() => {
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
  
  const columnImages = useMemo(() => {
    const columns = Array(columnCount).fill(0).map(() => []);
    
    const columnHeights = Array(columnCount).fill(0);
    
    images.forEach((image) => {
      const shortestColumnIndex = columnHeights.indexOf(Math.min(...columnHeights));
      
      columns[shortestColumnIndex].push(image);
      
      const heightFactor = image.orientation === 'portrait' ? 1.33 : 
                          image.orientation === 'landscape' ? 0.75 : 1;
      columnHeights[shortestColumnIndex] += heightFactor;
    });
    
    return columns;
  }, [images, columnCount]);

  useEffect(() => {
    if (images.length > 0 && !isLoading) {
      if (progressiveLoadRef.current) return;
      progressiveLoadRef.current = true;
      
      const firstTierCount = Math.min(6, images.length);
      const firstTier = images.slice(0, firstTierCount).map(img => img.src);
      
      const secondTierCount = Math.min(16, images.length) - firstTierCount;
      const secondTier = secondTierCount > 0 
        ? images.slice(firstTierCount, firstTierCount + secondTierCount).map(img => img.src)
        : [];
        
      const thirdTier = images.length > (firstTierCount + secondTierCount)
        ? images.slice(firstTierCount + secondTierCount).map(img => img.src)
        : [];
      
      preloadImages(firstTier, 1);
      
      if (secondTier.length > 0) {
        setTimeout(() => {
          preloadImages(secondTier, 2);
        }, 300);
      }
      
      if (thirdTier.length > 0) {
        setTimeout(() => {
          const chunkSize = 10;
          for (let i = 0; i < thirdTier.length; i += chunkSize) {
            const chunk = thirdTier.slice(i, i + chunkSize);
            setTimeout(() => {
              preloadImages(chunk, 3);
            }, i * 100);
          }
          
          progressiveLoadRef.current = false;
        }, 800);
      } else {
        progressiveLoadRef.current = false;
      }
    }
  }, [images, isLoading]);
  
  const infiniteScrollRef = useInfiniteScroll(loadMoreImages, isLoading);
  
  const handleImageClick = useCallback((image: any) => {
    setSelectedImageDetail(image);
    setIsImageDetailOpen(true);
  }, []);
  
  const handleCloseImageDetail = useCallback(() => {
    setIsImageDetailOpen(false);
    setSelectedImageDetail(null);
  }, []);

  const handlePageClick = useCallback((page: number) => {
    if (onPageChange && !isLoading) {
      clearSelection();
      onPageChange(page);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onPageChange, clearSelection, isLoading]);

  if (isLoading && images.length === 0) {
    return <MasonryLoading columnCount={columnCount} />;
  }

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

      {isLoading && (
        <div className="flex justify-center my-6">
          <LoadingSpinner size={32} />
        </div>
      )}
      
      {!isPaginationMode && hasMorePages && !isLoading && loadMoreImages && (
        <div ref={infiniteScrollRef} className="h-1 w-full my-4" />
      )}

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
