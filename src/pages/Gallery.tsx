
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/masonry/MasonryGrid';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { useAuth } from '@/context/AuthContext';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Image } from '@/utils/image/types'; // Update to use the correct Image type
import { toast } from 'sonner';

// Catégories pour les filtres
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { userRole, user } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const { userProfile } = useUserProfile(user, userRole);
  const pageLoadTimeRef = useRef(Date.now());
  
  // Mode de pagination actuel (true = pagination traditionnelle, false = défilement infini)
  const [usePaginationMode, setUsePaginationMode] = useState(true);

  const {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    selectedProject,
    currentPage,
    totalCount,
    handlePageChange,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
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
  }, [searchQuery, activeTab, selectedClient, selectedProject, currentPage]);

  // Les images à afficher sont toujours celles de la requête actuelle (pas d'accumulation)
  const displayedImages = allImages;
  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  // Gestionnaire de changement de page optimisé
  const handlePageChangeWithTracking = useCallback((newPage: number) => {
    console.log(`Changing to page ${newPage}`);
    // Appeler le gestionnaire de page du hook
    handlePageChange(newPage);
  }, [handlePageChange]);

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
          userName={userProfile?.firstName || ''}
          userLastName={userProfile?.lastName || ''}
          userRole={userRole}
          userClientId={userClientId}
        />
        
        <div className="w-full px-1 py-6">
          {isLoading && allImages.length === 0 ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : displayedImages.length > 0 ? (
            <MasonryGrid 
              images={formatImagesForGrid(displayedImages)} 
              isLoading={isLoading || isFetching}
              totalCount={totalCount}
              currentPage={currentPage}
              onPageChange={handlePageChangeWithTracking}
              // Ne pas passer loadMoreImages en mode pagination
              loadMoreImages={usePaginationMode ? undefined : undefined} // Toujours undefined pour forcer le mode de pagination classique
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
