
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/masonry/MasonryGrid';
import { MasonryPagination } from '@/components/gallery/masonry/MasonryPagination';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { useAuth } from '@/context/AuthContext';
import { useGalleryImages } from '@/hooks/useGalleryImages';
import { useUserProfile } from '@/hooks/useUserProfile';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Trash2, Bug } from 'lucide-react';
import { clearImageCachesOnly } from '@/utils/image/smartCacheManager';
import { GalleryDownloadButtons } from '@/components/gallery/GalleryDownloadButtons';
import { useImageSelection } from '@/hooks/useImageSelection';
import { CacheDebugPanel } from '@/components/admin/CacheDebugPanel';
import { useSmartCacheInvalidation } from '@/hooks/useSmartCacheInvalidation';
import { useGalleryRealtime } from '@/hooks/gallery/useGalleryRealtime';

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
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const {
    selectedImages,
    toggleImageSelection,
    clearSelection,
    selectAllImages
  } = useImageSelection();
  const { invalidateImageCaches, forceRefreshProject } = useSmartCacheInvalidation();
  
  // Setup realtime listening for automatic cache invalidation
  useGalleryRealtime();

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
    userRole: galleryUserRole,
    userClientId,
    shouldFetchRandom
  } = useGalleryImages(isAdmin);

  // Log détaillé pour le projet problématique
  useEffect(() => {
    const PROBLEMATIC_PROJECT_ID = '4949c2d4-90f4-44e8-b346-443cd82d9792';
    if (selectedProject === PROBLEMATIC_PROJECT_ID) {
      console.log('🔍 PROBLEMATIC PROJECT DETECTED:', {
        projectId: selectedProject,
        imagesCount: allImages.length,
        isLoading,
        isFetching,
        currentPage,
        totalCount
      });
      
      if (allImages.length === 0 && !isLoading) {
        console.warn('⚠️ No images found for problematic project - potential cache issue');
      }
    }
  }, [selectedProject, allImages.length, isLoading, isFetching, currentPage]);

  // Réinitialiser les filtres lorsqu'ils changent
  useEffect(() => {
    if (currentPage === 1) {
      pageLoadTimeRef.current = Date.now();
    }
  }, [searchQuery, activeTab, selectedClient, selectedProject, selectedOrientation, currentPage]);

  // Les images à afficher sont toujours celles de la requête actuelle
  const displayedImages = allImages;

  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  // Fonction intelligente pour vider le cache d'images (préserve l'auth)
  const handleSmartFlushCache = useCallback(async () => {
    setIsFlushing(true);
    try {
      console.log('🧹 Smart cache flush starting...');
      
      // Utiliser le nouveau système de cache intelligent
      clearImageCachesOnly();
      
      // Invalider les caches React Query des images
      await invalidateImageCaches(selectedProject, selectedClient);
      
      toast.success('Cache d\'images vidé intelligemment', {
        description: 'Session utilisateur préservée. Images rechargées depuis le serveur.'
      });

      // Rafraîchir la galerie après avoir vidé le cache
      setTimeout(() => {
        refreshGallery();
      }, 500);
      
    } catch (error) {
      console.error('Error during smart cache flush:', error);
      toast.error('Erreur lors du vidage intelligent du cache');
    } finally {
      setIsFlushing(false);
    }
  }, [refreshGallery, invalidateImageCaches, selectedProject, selectedClient]);

  // Fonction pour forcer le refresh du projet problématique
  const handleForceRefreshProject = useCallback(async () => {
    if (!selectedProject) {
      toast.error('Aucun projet sélectionné');
      return;
    }
    
    setIsFlushing(true);
    try {
      console.log(`🔄 Force refreshing project: ${selectedProject}`);
      
      await forceRefreshProject(selectedProject);
      
      toast.success('Projet actualisé avec succès', {
        description: 'Toutes les données ont été rechargées depuis la base.'
      });
      
      // Rafraîchir la galerie
      setTimeout(() => {
        refreshGallery();
      }, 300);
      
    } catch (error) {
      console.error('Error force refreshing project:', error);
      toast.error('Erreur lors de l\'actualisation du projet');
    } finally {
      setIsFlushing(false);
    }
  }, [selectedProject, forceRefreshProject, refreshGallery]);
  
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

        {isAdmin && (
          <div className="flex justify-end px-4 mb-2 gap-2">
            <Button
              variant="outline" 
              size="sm"
              disabled={isFlushing}
              onClick={handleSmartFlushCache}
              className="flex items-center gap-1"
            >
              <Trash2 className="h-4 w-4" /> 
              {isFlushing ? 'Vidage...' : 'Vider Cache Images'}
            </Button>
            
            {selectedProject && (
              <Button
                variant="outline" 
                size="sm"
                disabled={isFlushing}
                onClick={handleForceRefreshProject}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> 
                {isFlushing ? 'Actualisation...' : 'Actualiser Projet'}
              </Button>
            )}
            
            <Button
              variant="ghost" 
              size="sm"
              onClick={() => setShowDebugPanel(!showDebugPanel)}
              className="flex items-center gap-1"
            >
              <Bug className="h-4 w-4" /> 
              Debug Cache
            </Button>
          </div>
        )}

        {/* Panel de debug admin */}
        {isAdmin && showDebugPanel && (
          <div className="px-4 mb-6">
            <CacheDebugPanel />
          </div>
        )}


        <div className="w-full px-0 py-0">
          {isLoading && allImages.length === 0 ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : displayedImages.length > 0 ? (
            <>
              <MasonryGrid 
                images={displayedImages} 
                isLoading={isLoading || isFetching} 
                selectedImages={selectedImages} 
                onImageSelect={toggleImageSelection} 
                onClearSelection={clearSelection}
                onSelectAll={selectAllImages}
              />
              <MasonryPagination 
                totalCount={totalCount}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                isLoading={isLoading || isFetching}
              />
            </>
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
};

export default Gallery;
