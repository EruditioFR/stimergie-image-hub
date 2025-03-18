
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
    currentPage,
    totalCount,
    handlePageChange,
    handleTabChange,
    handleClientChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid,
    userRole: galleryUserRole,
    userClientId
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
    if (isLoading || isFetching || isLoadingMore) return;
    
    const nextPage = currentPage + 1;
    if (totalCount > infiniteImages.length) {
      setIsLoadingMore(true);
      handlePageChange(nextPage);
    }
  }, [currentPage, handlePageChange, infiniteImages.length, isLoading, isFetching, isLoadingMore, totalCount]);

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
  }, [searchQuery, activeTab, selectedClient, currentPage]);

  useEffect(() => {
    console.log('Component mounted, loading initial data');
    
    // Reset state when unmounting (for when we return to the page)
    return () => {
      console.log('Component unmounting, resetting state');
    };
  }, []);

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
    userClientId
  });

  // Calculate if there are more pages to load
  const hasMorePages = infiniteImages.length < totalCount;

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
