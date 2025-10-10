import { MasonryGrid } from '@/components/gallery/masonry/MasonryGrid';
import { MasonryPagination } from '@/components/gallery/masonry/MasonryPagination';
import { EmptyResults } from '@/components/gallery/EmptyResults';

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
        <div ref={setSentinelRef} className="h-20 flex items-center justify-center">
          {(isLoading || isFetching) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <span>Chargement...</span>
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
