
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
  const [searchParams, setSearchParams] = useSearchParams();
  
  const isMobile = useIsMobile();
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isWidescreen = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const isUltrawide = useMediaQuery('(min-width: 1536px)');
  
  // Calculer le nombre de colonnes en fonction de la taille de l'écran
  const columnCount = useMemo(() => {
    if (isUltrawide) return 5;
    if (isWidescreen) return 4;
    if (isDesktop) return 3;
    if (isTablet) return 2;
    return 3; // Sur mobile, on utilise 3 colonnes
  }, [isUltrawide, isWidescreen, isDesktop, isTablet, isMobile]);
  
  // Distribuer les images dans les colonnes
  const columnImages = useMemo(() => {
    const columns = Array(columnCount).fill(0).map(() => []);
    
    images.forEach((image, index) => {
      const columnIndex = index % columnCount;
      columns[columnIndex].push(image);
    });
    
    return columns;
  }, [images, columnCount]);

  // Optimisation du préchargement d'image
  useEffect(() => {
    if (images.length > 0 && !isLoading) {
      // Extraire toutes les URLs d'images de la page actuelle et les précharger
      const imageUrls = images.slice(0, 20).map(img => img.src);
      preloadImages(imageUrls);
    }
  }, [images, isLoading]);
  
  // Référence pour le défilement infini (utilisé uniquement en mode infini)
  const infiniteScrollRef = useInfiniteScroll(loadMoreImages, isLoading);
  
  // Gestionnaire de clic d'image
  const handleImageClick = (image: any) => {
    setSelectedImageDetail(image);
    setIsImageDetailOpen(true);
  };
  
  // Fermer la modale de détail d'image
  const handleCloseImageDetail = () => {
    setIsImageDetailOpen(false);
    setSelectedImageDetail(null);
  };

  // Gestionnaire de changement de page
  const handlePageClick = useCallback((page: number) => {
    if (onPageChange && !isLoading) {
      // Nettoyer la sélection avant de changer de page
      clearSelection();
      
      // Notifier le parent du changement de page
      onPageChange(page);
      
      // Remonter en haut de la page avec une animation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [onPageChange, clearSelection, isLoading]);

  // Afficher un placeholder de chargement lorsqu'il n'y a pas d'images
  if (isLoading && images.length === 0) {
    return <MasonryLoading columnCount={columnCount} />;
  }

  // Déterminer le mode d'affichage: pagination classique ou infinite scroll
  const isPaginationMode = !loadMoreImages;

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

      {/* Indicateur de chargement */}
      {isLoading && (
        <div className="flex justify-center my-6">
          <LoadingSpinner size={32} />
        </div>
      )}
      
      {/* Élément sentinelle pour le défilement infini (uniquement en mode infini) */}
      {!isPaginationMode && hasMorePages && !isLoading && loadMoreImages && (
        <div ref={infiniteScrollRef} className="h-1 w-full my-4" />
      )}

      {/* Afficher la pagination classique */}
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
