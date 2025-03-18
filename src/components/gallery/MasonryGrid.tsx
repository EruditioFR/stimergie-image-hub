
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
import { useMediaQuery } from '@/hooks/use-mobile';

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
  const [visibleImageRange, setVisibleImageRange] = useState({ start: 0, end: 20 });
  const { user } = useAuth();
  const { selectedImages, toggleImageSelection, isImageSelected, clearSelection } = useImageSelection();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Utiliser des media queries pour déterminer le nombre de colonnes
  const isMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 641px) and (max-width: 1023px)');
  const isDesktop = useMediaQuery('(min-width: 1024px) and (max-width: 1279px)');
  const isWidescreen = useMediaQuery('(min-width: 1280px) and (max-width: 1535px)');
  const isUltrawide = useMediaQuery('(min-width: 1536px)');

  useInfiniteScroll(onLoadMore, isLoading);
  
  // Déterminer le nombre de colonnes en fonction de la taille de l'écran
  const columnCount = useMemo(() => {
    if (isUltrawide) return 5;
    if (isWidescreen) return 4;
    if (isDesktop) return 3;
    if (isTablet) return 2;
    return 3; // Sur mobile, on utilise maintenant 3 colonnes
  }, [isUltrawide, isWidescreen, isDesktop, isTablet, isMobile]);
  
  // Distribuer les images dans les colonnes
  const columnImages = useMemo(() => {
    const columns = Array(columnCount).fill(0).map(() => []);
    
    // Distribuer les images en fonction de l'orientation pour un meilleur équilibre
    images.forEach((image, index) => {
      // Répartir les images en fonction de l'index pour équilibrer les colonnes
      const columnIndex = index % columnCount;
      columns[columnIndex].push(image);
    });
    
    return columns;
  }, [images, columnCount]);
  
  // Optimiser le chargement des images au défilement
  const handleScroll = useCallback(() => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    
    // Calculer la plage visible d'images
    // Images visibles = celles dans la fenêtre visible + marge de 1000px avant/après
    const visibleStart = Math.max(0, Math.floor((scrollTop - 1000) / 300) * columnCount);
    const visibleEnd = Math.min(
      images.length, 
      Math.ceil((scrollTop + windowHeight + 1000) / 300) * columnCount
    );
    
    // Mettre à jour la plage d'images visibles
    setVisibleImageRange({ start: visibleStart, end: visibleEnd });
    
    // Précharger les prochaines images
    if (images.length > visibleEnd) {
      const nextBatchImages = images.slice(visibleEnd, visibleEnd + columnCount * 5);
      if (nextBatchImages.length > 0) {
        preloadImages(nextBatchImages.map(img => img.src));
      }
    }
    
    // Libérer le cache des images qui sont loin de la vue
    if (images.length > 50) {
      const visibleImages = images.slice(visibleStart, visibleEnd);
      clearOffscreenImagesFromCache(visibleImages.map(img => img.src));
    }
  }, [images, columnCount]);
  
  // Précharger les premières images visibles
  useEffect(() => {
    if (images.length > 0) {
      // Optimiser la stratégie de préchargement
      const preloadImagesInBatches = () => {
        // Précharger les 12 premières images immédiatement
        const initialBatch = images.slice(0, 12).map(img => img.src);
        preloadImages(initialBatch);
        
        // Précharger les 12 suivantes avec un délai
        if (images.length > 12) {
          setTimeout(() => {
            if (document.visibilityState === 'visible') { // Vérifier si la page est visible
              const nextBatch = images.slice(12, 24).map(img => img.src);
              preloadImages(nextBatch);
            }
          }, 500);
          
          // Précharger encore plus d'images après un délai plus long
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
    
    // Configurer l'écouteur d'événements de défilement
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Nettoyer l'écouteur au démontage
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [images, handleScroll]);
  
  // Charger une image spécifique depuis l'URL
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

  // Afficher l'état de chargement initial
  if (isLoading && images.length === 0) {
    // Créer un squelette adaptatif
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
