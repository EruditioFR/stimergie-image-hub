
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
import { Image } from '@/utils/image/types'; 
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { clearAllCaches } from '@/utils/image/cacheManager';

// Catégories pour les filtres
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { userRole, user } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const { userProfile } = useUserProfile(user, userRole);
  const pageLoadTimeRef = useRef(Date.now());
  const [isFlushing, setIsFlushing] = useState(false);

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
    shouldFetchRandom
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
    console.log('Loading more gallery images');
    handlePageChange(currentPage + 1);
  }, [currentPage, handlePageChange]);
  
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <GalleryHeader 
          title="Banque d'images"
          activeTab={activeTab}
          onTabChange={handleTabChange}
          categories={categories}
          selectedClient={selectedClient}
          onClientChange={handleClientChange}
          selectedProject={selectedProject}
          onProjectChange={handleProjectChange}
          selectedOrientation={selectedOrientation}
          onOrientationChange={handleOrientationChange}
          userName={userProfile?.firstName || ''}
          userLastName={userProfile?.lastName || ''}
          userRole={userRole}
          userClientId={userClientId}
        />
        
        {isAdmin && (
          <div className="flex justify-end px-4 -mt-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFlushCache}
              disabled={isFlushing}
              className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              {isFlushing ? 'Vidage en cours...' : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Vider le cache d'images
                </>
              )}
            </Button>
          </div>
        )}
        
        <div className="w-full px-1 py-6">
          {isLoading && allImages.length === 0 ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : displayedImages.length > 0 ? (
            <MasonryGrid 
              images={formattedImages} 
              isLoading={isLoading || isFetching}
              hasMorePages={currentPage * 20 < totalCount}
              loadMoreImages={loadMoreImages}
            />
          ) : (
            <EmptyResults 
              onReset={handleResetFilters} 
              hasFilters={hasActiveFilters}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default Gallery;
