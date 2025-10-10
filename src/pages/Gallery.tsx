
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
import { Trash2, Bug, Infinity } from 'lucide-react';
import { clearImageCachesOnly } from '@/utils/image/smartCacheManager';
import { GalleryDownloadButtons } from '@/components/gallery/GalleryDownloadButtons';
import { useImageSelection } from '@/hooks/useImageSelection';
import { CacheDebugPanel } from '@/components/admin/CacheDebugPanel';
import { useSmartCacheInvalidation } from '@/hooks/useSmartCacheInvalidation';
import { useGalleryRealtime } from '@/hooks/gallery/useGalleryRealtime';
import { useInfiniteScroll } from '@/hooks/gallery/useInfiniteScroll';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

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
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(false);
  const [accumulatedImages, setAccumulatedImages] = useState<any[]>([]);
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
    shouldFetchRandom,
    hasMorePages
  } = useGalleryImages(isAdmin);

  // Gestion de l'infinite scroll
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

  // Gestion des images accumulées pour l'infinite scroll
  useEffect(() => {
    if (infiniteScrollEnabled) {
      if (currentPage === 1) {
        // Réinitialiser l'accumulation lors d'un changement de filtre
        setAccumulatedImages(allImages);
      } else {
        // Ajouter les nouvelles images aux images existantes
        setAccumulatedImages(prev => {
          const existingIds = new Set(prev.map(img => img.id));
          const newImages = allImages.filter(img => !existingIds.has(img.id));
          return [...prev, ...newImages];
        });
      }
    } else {
      // En mode pagination classique, afficher uniquement les images de la page courante
      setAccumulatedImages(allImages);
    }
  }, [allImages, currentPage, infiniteScrollEnabled]);

  // Réinitialiser l'accumulation lors d'un changement de filtre
  useEffect(() => {
    setAccumulatedImages([]);
  }, [searchQuery, activeTab, selectedClient, selectedProject, selectedOrientation]);

  // Les images à afficher selon le mode
  const displayedImages = infiniteScrollEnabled ? accumulatedImages : allImages;

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

        <div className="flex justify-between items-center px-4 mb-2">
          {/* Toggle infinite scroll */}
          <div className="flex items-center space-x-2">
            <Switch
              id="infinite-scroll"
              checked={infiniteScrollEnabled}
              onCheckedChange={setInfiniteScrollEnabled}
            />
            <Label htmlFor="infinite-scroll" className="flex items-center gap-2 cursor-pointer">
              <Infinity className="h-4 w-4" />
              Défilement infini
            </Label>
          </div>

          {isAdmin && (
            <div className="flex gap-2">
              <Button
                variant="outline" 
                size="sm"
                disabled={isFlushing}
                onClick={handleSmartFlushCache}
                className="flex items-center gap-1"
              >
                <Trash2 className="h-4 w-4" /> 
                {isFlushing ? 'Vidage...' : 'Vider Cache'}
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
                Debug
              </Button>
            </div>
          )}
        </div>

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
              {!infiniteScrollEnabled && (
                <div className="mb-4">
                  <MasonryPagination 
                    totalCount={totalCount}
                    currentPage={currentPage}
                    onPageChange={handlePageChange}
                    isLoading={isLoading || isFetching}
                  />
                </div>
              )}
              
              <MasonryGrid 
                images={displayedImages} 
                isLoading={isLoading || isFetching} 
                selectedImages={selectedImages} 
                onImageSelect={toggleImageSelection} 
                onClearSelection={clearSelection}
                onSelectAll={selectAllImages}
              />
              
              {/* Sentinel pour l'infinite scroll */}
              {infiniteScrollEnabled && hasMorePages && (
                <div ref={setSentinelRef} className="h-20 flex items-center justify-center">
                  {(isLoading || isFetching) && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <span>Chargement...</span>
                    </div>
                  )}
                </div>
              )}
              
              {!infiniteScrollEnabled && (
                <MasonryPagination 
                  totalCount={totalCount}
                  currentPage={currentPage}
                  onPageChange={handlePageChange}
                  isLoading={isLoading || isFetching}
                />
              )}
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
