
import { useState, useEffect, useCallback } from 'react';
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

// Mock categories for filters
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { userRole, user } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const { userProfile } = useUserProfile(user, userRole);

  // State for infinite scrolling
  const [infiniteImages, setInfiniteImages] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Initialize infinite images on first load or filter change
  useEffect(() => {
    if (allImages.length > 0) {
      setInfiniteImages(prevImages => {
        if (currentPage === 1) {
          return [...allImages];
        } else {
          return prevImages;
        }
      });
    }
  }, [allImages, currentPage]);

  // Function to load more images
  const loadMoreImages = useCallback(() => {
    if (isLoading || isFetching || isLoadingMore || shouldFetchRandom) return;
    
    const nextPage = currentPage + 1;
    if (totalCount > infiniteImages.length) {
      setIsLoadingMore(true);
      handlePageChange(nextPage);
    }
  }, [currentPage, handlePageChange, infiniteImages.length, isLoading, isFetching, isLoadingMore, totalCount, shouldFetchRandom]);

  // Add newly loaded images to our infinite scroll collection
  useEffect(() => {
    if (currentPage > 1 && allImages.length > 0 && !isLoading) {
      // Append new images to existing images
      setInfiniteImages(prevImages => {
        // Check for duplicates by creating a Set of IDs
        const existingIds = new Set(prevImages.map(img => img.id));
        const newImages = allImages.filter(img => !existingIds.has(img.id));
        
        if (newImages.length === 0) {
          toast.info("Toutes les images ont été chargées");
        }
        
        setIsLoadingMore(false);
        return [...prevImages, ...newImages];
      });
    }
  }, [allImages, currentPage, isLoading]);

  // Reset infinite images when filters change
  useEffect(() => {
    // When any filter changes, the currentPage will be set to 1 and
    // we need to reset our infinite scroll collection
    if (currentPage === 1) {
      setInfiniteImages([]);
    }
  }, [searchQuery, activeTab, selectedClient, selectedProject, currentPage]);

  const displayedImages = infiniteImages.length > 0 ? infiniteImages : allImages;
  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  console.log('Render state:', { 
    hasImages: displayedImages.length > 0, 
    isLoading, 
    hasActiveFilters,
    imagesCount: allImages.length,
    infiniteImagesCount: infiniteImages.length,
    totalCount,
    currentPage,
    isAdmin,
    userRole,
    userClientId,
    shouldFetchRandom
  });

  // Calculate if there are more pages to load (only for non-random queries)
  const hasMorePages = !shouldFetchRandom && infiniteImages.length < totalCount;

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
          {isLoading && allImages.length === 0 && infiniteImages.length === 0 ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : displayedImages.length > 0 ? (
            <MasonryGrid 
              images={formatImagesForGrid(displayedImages)} 
              isLoading={isLoading || isFetching || isLoadingMore}
              totalCount={totalCount}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              hasMorePages={hasMorePages}
              loadMoreImages={hasMorePages ? loadMoreImages : undefined}
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
