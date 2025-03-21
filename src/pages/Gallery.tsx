
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
import { toast } from 'sonner';

// Mock categories for filters
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { userRole, user } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const { userProfile } = useUserProfile(user, userRole);
  const pageLoadTimeRef = useRef(Date.now());

  // State for infinite scrolling
  const [infiniteImages, setInfiniteImages] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // State for preloading status
  const [preloadedPages, setPreloadedPages] = useState<number[]>([]);

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
      // Performance tracking
      const loadTime = Date.now() - pageLoadTimeRef.current;
      console.log(`Images loaded in ${loadTime}ms`);
      
      setInfiniteImages(prevImages => {
        if (currentPage === 1) {
          return [...allImages];
        } else {
          return prevImages;
        }
      });
      
      // If this is the first page, mark it as preloaded
      if (currentPage === 1 && !preloadedPages.includes(1)) {
        setPreloadedPages([...preloadedPages, 1]);
      }
    }
  }, [allImages, currentPage, preloadedPages]);

  // Function to load more images
  const loadMoreImages = useCallback(() => {
    if (isLoading || isFetching || isLoadingMore || shouldFetchRandom) return;
    
    const nextPage = currentPage + 1;
    if (totalCount > infiniteImages.length) {
      setIsLoadingMore(true);
      handlePageChange(nextPage);
      
      // Mark this page as being loaded
      if (!preloadedPages.includes(nextPage)) {
        setPreloadedPages(prev => [...prev, nextPage]);
      }
    }
  }, [currentPage, handlePageChange, infiniteImages.length, isLoading, isFetching, isLoadingMore, totalCount, shouldFetchRandom, preloadedPages]);

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
    // When any filter changes, reset state
    if (currentPage === 1) {
      setInfiniteImages([]);
      setPreloadedPages([]);
      pageLoadTimeRef.current = Date.now();
    }
  }, [searchQuery, activeTab, selectedClient, selectedProject, currentPage]);

  // Preload next page for smoother scrolling
  useEffect(() => {
    if (shouldFetchRandom || isLoading || isFetching) return;
    
    const nextPage = currentPage + 1;
    const hasMorePages = !shouldFetchRandom && infiniteImages.length < totalCount;
    
    // Only preload if we haven't already and there are more pages
    if (hasMorePages && !preloadedPages.includes(nextPage)) {
      // Wait a bit to not interfere with current page loading
      const timer = setTimeout(() => {
        console.log(`Preloading page ${nextPage}`);
        // This will trigger the query prefetch in useGalleryImages
        handlePageChange(nextPage);
        // Immediately go back to current page to not disrupt the UI
        setTimeout(() => handlePageChange(currentPage), 100);
        
        // Mark as preloaded
        setPreloadedPages(prev => [...prev, nextPage]);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [currentPage, totalCount, infiniteImages.length, shouldFetchRandom, isLoading, isFetching, preloadedPages, handlePageChange]);

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
    shouldFetchRandom,
    preloadedPages
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
