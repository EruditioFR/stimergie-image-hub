
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

// Catégories pour les filtres
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const { userRole, user } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);
  const { userProfile } = useUserProfile(user, userRole);
  const pageLoadTimeRef = useRef(Date.now());

  // État pour le défilement infini
  const [infiniteImages, setInfiniteImages] = useState<any[]>([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  // État pour le statut de préchargement
  const [preloadedPages, setPreloadedPages] = useState<number[]>([]);
  const preloadingRef = useRef(false);

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

  // Initialiser les images infinies lors du premier chargement ou du changement de filtre
  useEffect(() => {
    if (allImages.length > 0) {
      // Suivi des performances
      const loadTime = Date.now() - pageLoadTimeRef.current;
      console.log(`Images loaded in ${loadTime}ms`);
      
      // Remplacer les images s'il s'agit de la première page, sinon conserver l'état précédent
      if (currentPage === 1) {
        setInfiniteImages(allImages);
        
        // Marquer comme préchargé si c'est la première page
        if (!preloadedPages.includes(1)) {
          setPreloadedPages([1]);
        }
      }
    }
  }, [allImages, currentPage, preloadedPages]);

  // Fonction pour charger plus d'images
  const loadMoreImages = useCallback(() => {
    if (isLoading || isFetching || isLoadingMore || shouldFetchRandom) return;
    
    const nextPage = currentPage + 1;
    if (totalCount > infiniteImages.length) {
      setIsLoadingMore(true);
      handlePageChange(nextPage);
      
      // Marquer cette page comme étant chargée
      if (!preloadedPages.includes(nextPage)) {
        setPreloadedPages(prev => [...prev, nextPage]);
      }
    }
  }, [currentPage, handlePageChange, infiniteImages.length, isLoading, isFetching, isLoadingMore, totalCount, shouldFetchRandom, preloadedPages]);

  // Ajouter les images nouvellement chargées à notre collection de défilement infini
  useEffect(() => {
    if (currentPage > 1 && allImages.length > 0 && !isLoading) {
      // Ajouter de nouvelles images aux images existantes
      setInfiniteImages(prevImages => {
        // Vérifier les doublons en créant un ensemble d'IDs
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

  // Réinitialiser les images infinies lorsque les filtres changent
  useEffect(() => {
    // Lorsque n'importe quel filtre change, réinitialiser l'état
    if (currentPage === 1) {
      setInfiniteImages([]);
      setPreloadedPages([]);
      pageLoadTimeRef.current = Date.now();
    }
  }, [searchQuery, activeTab, selectedClient, selectedProject, currentPage]);

  // Précharger la page suivante pour un défilement plus fluide (optimisé)
  useEffect(() => {
    // Éviter de précharger dans des conditions non nécessaires
    if (shouldFetchRandom || isLoading || isFetching || preloadingRef.current) return;
    
    const nextPage = currentPage + 1;
    const hasMorePages = !shouldFetchRandom && infiniteImages.length < totalCount;
    
    // Précharger uniquement si nous ne l'avons pas déjà fait et s'il y a plus de pages
    if (hasMorePages && !preloadedPages.includes(nextPage)) {
      // Éviter les préchargements simultanés
      preloadingRef.current = true;
      
      // Attendre un peu pour ne pas interférer avec le chargement de la page actuelle
      const timer = setTimeout(() => {
        console.log(`Preloading page ${nextPage}`);
        // Cela déclenchera le préchargement de la requête dans useGalleryImages
        handlePageChange(nextPage);
        // Revenir immédiatement à la page actuelle pour ne pas perturber l'interface utilisateur
        setTimeout(() => {
          handlePageChange(currentPage);
          preloadingRef.current = false;
        }, 100);
        
        // Marquer comme préchargé
        setPreloadedPages(prev => [...prev, nextPage]);
      }, 3000); // Attendre plus longtemps pour réduire la charge réseau
      
      return () => {
        clearTimeout(timer);
        preloadingRef.current = false;
      };
    }
  }, [currentPage, totalCount, infiniteImages.length, shouldFetchRandom, isLoading, isFetching, preloadedPages, handlePageChange]);

  const displayedImages = infiniteImages.length > 0 ? infiniteImages : allImages;
  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  // Calculer s'il y a plus de pages à charger (uniquement pour les requêtes non aléatoires)
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
