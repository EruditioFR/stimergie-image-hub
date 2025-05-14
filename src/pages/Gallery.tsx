
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/masonry/MasonryGrid';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { useAuth } from '@/context/AuthContext';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { clearAllCaches } from '@/utils/image/cacheManager';
import { GalleryDownloadButtons } from '@/components/gallery/GalleryDownloadButtons';
import { useImageSelection } from '@/hooks/useImageSelection';

// Catégories pour les filtres
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];
const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const {
    userRole,
    user
  } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const {
    userProfile
  } = useUserProfile(user, userRole);
  const pageLoadTimeRef = useRef(Date.now());
  const [isFlushing, setIsFlushing] = useState(false);
  
  const { selectedImages, toggleImageSelection, clearSelection } = useImageSelection();
  
  const {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    currentPage,
    totalCount,
    handlePageChange,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleOrientationChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid,
    userRole: galleryUserRole,
    userClientId,
    shouldFetchRandom,
    hasMorePages
  } = useGalleryImages(isAdmin);

  // Réinitialiser les filtres lorsqu'ils changent
  useEffect(() => {
    if (currentPage === 1) {
      pageLoadTimeRef.current = Date.now();
    }
  }, [searchQuery, activeTab, selectedClient, selectedProject, selectedOrientation, currentPage]);

  // Les images à afficher sont toujours celles de la requête actuelle (pas d'accumulation)
  const displayedImages = allImages;

  // Formater les images pour la grille masonry en prenant en compte les dimensions et proportions
  const formattedImages = useMemo(() => {
    console.log(`Formatting ${displayedImages.length} images for grid display...`);
    return formatImagesForGrid(displayedImages);
  }, [displayedImages, formatImagesForGrid]);
  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  // Fonction pour charger plus d'images en défilement infini
  const loadMoreImages = useCallback(() => {
    if (hasMorePages && !isLoading && !isFetching) {
      console.log('Loading more gallery images, page:', currentPage + 1);
      handlePageChange(currentPage + 1);
    }
  }, [currentPage, handlePageChange, hasMorePages, isLoading, isFetching]);

  // Fonction pour vider le cache d'images
  const handleFlushCache = useCallback(() => {
    setIsFlushing(true);
    try {
      clearAllCaches();
      toast.success('Cache d\'images vidé', {
        description: 'Toutes les images seront rechargées depuis le serveur.'
      });

      // Rafraîchir la galerie après avoir vidé le cache
      setTimeout(() => {
        refreshGallery();
      }, 500);
    } catch (error) {
      console.error('Error flushing cache:', error);
      toast.error('Erreur lors du vidage du cache');
    } finally {
      setIsFlushing(false);
    }
  }, [refreshGallery]);
  return <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-screen px-0">
  <GalleryHeader title="Banque d'images" activeTab={activeTab} onTabChange={handleTabChange} categories={categories} selectedClient={selectedClient} onClientChange={handleClientChange} selectedProject={selectedProject} onProjectChange={handleProjectChange} selectedOrientation={selectedOrientation} onOrientationChange={handleOrientationChange} userName={userProfile?.firstName || ''} userLastName={userProfile?.lastName || ''} userRole={userRole} userClientId={userClientId} />

  <div className="flex justify-between items-center w-full px-4 -mt-2 mb-2">
    <div className="flex items-center gap-4">
      {/* Afficher les boutons de téléchargement uniquement si des images sont sélectionnées */}
      {selectedImages.length > 0 && displayedImages.length > 0 && (
        <GalleryDownloadButtons images={displayedImages.filter(img => selectedImages.includes(img.id))} />
      )}

      {isAdmin && (
        <Button
          onClick={handleFlushCache}
          variant="outline"
          size="sm"
          disabled={isFlushing}
          className="ml-auto"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          {isFlushing ? "Vidage en cours..." : "Vider le cache"}
        </Button>
      )}
    </div>
  </div>

  <div className="w-full px-0 py-0">
    {isLoading && allImages.length === 0 ? (
      <MasonryGrid images={[]} isLoading={true} />
    ) : displayedImages.length > 0 ? (
      <MasonryGrid 
        images={formattedImages} 
        isLoading={isLoading || isFetching} 
        hasMorePages={hasMorePages} 
        loadMoreImages={loadMoreImages}
        selectedImages={selectedImages}
        onImageSelect={toggleImageSelection}
        onClearSelection={clearSelection}
      />
    ) : (
      <EmptyResults onReset={handleResetFilters} hasFilters={hasActiveFilters} />
    )}
  </div>
    </main>

      
      <Footer />
    </div>;
};
export default Gallery;
