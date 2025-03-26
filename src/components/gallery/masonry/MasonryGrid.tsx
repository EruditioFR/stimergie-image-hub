import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { MasonryDetailModal } from './MasonryDetailModal';
import { MasonryToolbar } from './MasonryToolbar';
import { MasonryPagination } from './MasonryPagination';
import { MasonryLoading } from './MasonryLoading';
import { preloadImages } from '@/components/LazyImage';
import { MasonryColumn } from './MasonryColumn';
import { useImageSelection } from '@/hooks/useImageSelection';
import { SelectionToolbar } from '../SelectionToolbar';
import { type ImageForGrid } from '@/types/image';

interface MasonryGridProps {
  images: ImageForGrid[];
  isLoading?: boolean;
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  loadMoreImages?: () => void;
}

export const MasonryGrid: React.FC<MasonryGridProps> = ({
  images,
  isLoading = false,
  totalCount,
  currentPage,
  onPageChange,
  loadMoreImages
}) => {
  const [columns, setColumns] = useState(3);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageForGrid | null>(null);
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedImageIds, toggleImageSelection, clearSelection] = useImageSelection();
  
  // Calculate images per column
  const imagesPerColumn = useMemo(() => {
    const imagesByColumn: ImageForGrid[][] = Array.from({ length: columns }, () => []);
    
    images.forEach((image, index) => {
      imagesByColumn[index % columns].push(image);
    });
    
    return imagesByColumn;
  }, [images, columns]);
  
  // Preload images when component mounts or images change
  useEffect(() => {
    if (images && images.length > 0) {
      const imageUrls = images.map(image => image.src);
      preloadImages(imageUrls);
    }
  }, [images]);
  
  // Handle detail modal
  const handleImageClick = (image: ImageForGrid) => {
    setSelectedImage(image);
    setIsDetailOpen(true);
  };
  
  const handleCloseDetail = () => {
    setIsDetailOpen(false);
    setSelectedImage(null);
  };
  
  // Handle column count
  const handleColumnChange = (newColumns: number) => {
    setColumns(newColumns);
  };
  
  // Handle selection mode
  const handleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    if (isSelectionMode) {
      clearSelection();
    }
  };
  
  // Handle image selection
  const handleImageSelection = (imageId: string) => {
    toggleImageSelection(imageId);
  };
  
  // Handle toolbar visibility
  useEffect(() => {
    if (selectedImageIds.length > 0) {
      setIsToolbarVisible(true);
    } else {
      setIsToolbarVisible(false);
    }
  }, [selectedImageIds]);
  
  return (
    <div className="relative">
      {/* Toolbar */}
      {isSelectionMode && (
        <SelectionToolbar
          selectedCount={selectedImageIds.length}
          onClose={() => {
            setIsSelectionMode(false);
            clearSelection();
          }}
        />
      )}
      
      {/* Masonry Header */}
      <MasonryToolbar
        columns={columns}
        onColumnChange={handleColumnChange}
        onSelectionMode={handleSelectionMode}
        isSelectionMode={isSelectionMode}
      />
      
      {/* Grid */}
      <div className="masonry-grid">
        {imagesPerColumn.map((columnImages, index) => (
          <MasonryColumn
            key={index}
            images={columnImages}
            onImageClick={handleImageClick}
            isSelectionMode={isSelectionMode}
            selectedImageIds={selectedImageIds}
            onImageSelection={handleImageSelection}
          />
        ))}
      </div>
      
      {/* Loading */}
      {isLoading && <MasonryLoading />}
      
      {/* Pagination */}
      {onPageChange && currentPage && totalCount && (
        <MasonryPagination
          currentPage={currentPage}
          totalCount={totalCount}
          onPageChange={onPageChange}
        />
      )}
      
      {/* Load More Button */}
      {loadMoreImages && (
        <div className="flex justify-center mt-4">
          <Button onClick={loadMoreImages} disabled={isLoading}>
            {isLoading ? 'Chargement...' : 'Charger plus'}
          </Button>
        </div>
      )}
      
      {/* Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <MasonryDetailModal image={selectedImage} onClose={handleCloseDetail} />
        </DialogContent>
      </Dialog>
    </div>
  );
};
