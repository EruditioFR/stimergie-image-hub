
import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { GalleryContent } from '@/components/gallery/GalleryContent';
import { GalleryDebugControls } from '@/components/gallery/GalleryDebugControls';
import { GalleryScrollToggle } from '@/components/gallery/GalleryScrollToggle';
import { useAuth } from '@/context/AuthContext';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useImageSelection } from '@/hooks/useImageSelection';
import { useGalleryRealtime } from '@/hooks/gallery/useGalleryRealtime';
import { useInfiniteScroll } from '@/hooks/gallery/useInfiniteScroll';
import { useGalleryState } from '@/hooks/gallery/useGalleryState';

// Catégories pour les filtres
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { userRole, user } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const { userProfile } = useUserProfile(user, userRole);
  
  const { selectedImages, toggleImageSelection, clearSelection, selectAllImages } = useImageSelection();
  
  useGalleryRealtime();

  const galleryData = useGalleryImages(isAdmin);
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
    userClientId,
    hasMorePages
  } = galleryData;

  const {
    isFlushing,
    showDebugPanel,
    infiniteScrollEnabled,
    accumulatedImages,
    pageLoadTimeRef,
    setShowDebugPanel,
    setInfiniteScrollEnabled,
    setAccumulatedImages,
    handleSmartFlushCache,
    handleForceRefreshProject
  } = useGalleryState({ refreshGallery, selectedProject, selectedClient });

  const handleLoadMorePage = useCallback(() => {
    if (hasMorePages && !isLoading && !isFetching) {
      handlePageChange(currentPage + 1);
    }
  }, [hasMorePages, isLoading, isFetching, currentPage, handlePageChange]);

  const { setSentinelRef } = useInfiniteScroll({
    enabled: infiniteScrollEnabled,
    isLoading: isLoading || isFetching,
    hasMorePages: hasMorePages || false,
    currentPage,
    onLoadMore: handleLoadMorePage,
    threshold: 0.8
  });

  useEffect(() => {
    if (currentPage === 1) {
      pageLoadTimeRef.current = Date.now();
    }
  }, [searchQuery, activeTab, selectedClient, selectedProject, selectedOrientation, currentPage]);

  useEffect(() => {
    if (infiniteScrollEnabled) {
      if (currentPage === 1) {
        setAccumulatedImages(allImages);
      } else {
        setAccumulatedImages(prev => {
          const existingIds = new Set(prev.map(img => img.id));
          const newImages = allImages.filter(img => !existingIds.has(img.id));
          return [...prev, ...newImages];
        });
      }
    } else {
      setAccumulatedImages(allImages);
    }
  }, [allImages, currentPage, infiniteScrollEnabled]);

  useEffect(() => {
    setAccumulatedImages([]);
  }, [searchQuery, activeTab, selectedClient, selectedProject, selectedOrientation]);

  const displayedImages = infiniteScrollEnabled ? accumulatedImages : allImages;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-screen px-0">
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

        <div className="flex justify-between items-center px-4 mb-2">
          <GalleryScrollToggle 
            enabled={infiniteScrollEnabled}
            onToggle={setInfiniteScrollEnabled}
          />

          <GalleryDebugControls
            isAdmin={isAdmin}
            isFlushing={isFlushing}
            selectedProject={selectedProject}
            showDebugPanel={showDebugPanel}
            onSmartFlushCache={handleSmartFlushCache}
            onForceRefreshProject={handleForceRefreshProject}
            onToggleDebugPanel={() => setShowDebugPanel(!showDebugPanel)}
          />
        </div>

        <div className="w-full px-0 py-0">
          <GalleryContent
            displayedImages={displayedImages}
            allImages={allImages}
            isLoading={isLoading}
            isFetching={isFetching}
            infiniteScrollEnabled={infiniteScrollEnabled}
            hasMorePages={hasMorePages || false}
            totalCount={totalCount}
            currentPage={currentPage}
            hasActiveFilters={hasActiveFilters}
            selectedImages={selectedImages}
            toggleImageSelection={toggleImageSelection}
            clearSelection={clearSelection}
            selectAllImages={selectAllImages}
            handlePageChange={handlePageChange}
            handleResetFilters={handleResetFilters}
            setSentinelRef={setSentinelRef}
          />
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;
