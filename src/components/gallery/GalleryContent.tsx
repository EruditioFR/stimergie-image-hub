import { MasonryGrid } from '@/components/gallery/masonry/MasonryGrid';
import { MasonryPagination } from '@/components/gallery/masonry/MasonryPagination';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { Loader2 } from 'lucide-react';

interface GalleryContentProps {
  displayedImages: any[];
  allImages: any[];
  isLoading: boolean;
  isFetching: boolean;
  infiniteScrollEnabled: boolean;
  hasMorePages: boolean;
  totalCount: number;
  currentPage: number;
  hasActiveFilters: boolean;
  selectedImages: string[];
  toggleImageSelection: (id: string) => void;
  clearSelection: () => void;
  selectAllImages: (images: any[]) => void;
  handlePageChange: (page: number) => void;
  handleResetFilters: () => void;
  setSentinelRef: (node: HTMLDivElement | null) => void;
}

export const GalleryContent = ({
  displayedImages,
  allImages,
  isLoading,
  isFetching,
  infiniteScrollEnabled,
  hasMorePages,
  totalCount,
  currentPage,
  hasActiveFilters,
  selectedImages,
  toggleImageSelection,
  clearSelection,
  selectAllImages,
  handlePageChange,
  handleResetFilters,
  setSentinelRef
}: GalleryContentProps) => {
  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  if (isLoading && allImages.length === 0) {
    return <MasonryGrid images={[]} isLoading={true} />;
  }

  if (shouldShowEmptyState) {
    return <EmptyResults onReset={handleResetFilters} hasFilters={hasActiveFilters} />;
  }

  if (displayedImages.length === 0) {
    return null;
  }

  return (
    <>
      {!infiniteScrollEnabled && (
        <div className="mb-4">
          <MasonryPagination 
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            isLoading={isLoading || isFetching}
          />
        </div>
      )}
      
      <MasonryGrid 
        images={displayedImages} 
        isLoading={isLoading || isFetching} 
        selectedImages={selectedImages} 
        onImageSelect={toggleImageSelection} 
        onClearSelection={clearSelection}
        onSelectAll={selectAllImages}
        infiniteScrollEnabled={infiniteScrollEnabled}
      />
      
      {infiniteScrollEnabled && hasMorePages && (
        <div 
          ref={setSentinelRef} 
          className="w-full py-12 flex justify-center"
        >
          {isFetching && (
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">
                Chargement de plus d'images...
              </span>
            </div>
          )}
        </div>
      )}
      
      {!infiniteScrollEnabled && (
        <MasonryPagination 
          totalCount={totalCount}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isLoading={isLoading || isFetching}
        />
      )}
    </>
  );
};
