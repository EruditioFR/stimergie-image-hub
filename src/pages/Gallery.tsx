
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { useAuth } from '@/context/AuthContext';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/integrations/supabase/client';

// Mock categories for filters
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { userRole, user } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const userProfile = useUserProfile(user, userRole);

  const {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    loadMoreImages,
    handleTabChange,
    handleClientChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid,
    userRole: galleryUserRole,
    userClientId
  } = useGalleryImages(isAdmin);

  // Ensure we refetch when component mounts
  useEffect(() => {
    console.log('Component mounted, loading initial data');
    
    // Reset state when unmounting (for when we return to the page)
    return () => {
      console.log('Component unmounting, resetting state');
    };
  }, []);

  const displayedImages = allImages;
  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  console.log('Render state:', { 
    hasImages: displayedImages.length > 0, 
    isLoading, 
    hasActiveFilters,
    imagesCount: allImages.length,
    isAdmin,
    userRole,
    userClientId
  });

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
          {isLoading && allImages.length === 0 ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : displayedImages.length > 0 ? (
            <MasonryGrid 
              images={formatImagesForGrid(displayedImages)} 
              isLoading={isLoading || isFetching}
              onLoadMore={loadMoreImages}
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
