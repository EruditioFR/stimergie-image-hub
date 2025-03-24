
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchTotalImageCount, generateCacheKey } from '@/services/galleryService';

export const useGalleryCache = () => {
  const queryClient = useQueryClient();
  const previousRequestRef = useRef<string | null>(null);
  const isCountFetchingRef = useRef(false);

  // Gestion de la requête précédente pour l'annulation
  const setPreviousRequest = useCallback((
    searchQuery: string, 
    tagFilter: string, 
    activeTab: string, 
    selectedClient: string | null,
    selectedProject: string | null, 
    page: number, 
    randomMode: boolean,
    userRole: string,
    userClientId: string | null
  ) => {
    previousRequestRef.current = generateCacheKey(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      selectedProject, 
      page, 
      randomMode,
      userRole,
      userClientId
    ).join(',');
  }, []);

  // Cancel previous request
  const cancelPreviousRequest = useCallback(() => {
    if (previousRequestRef.current) {
      queryClient.cancelQueries({ queryKey: previousRequestRef.current.split(',') });
    }
  }, [queryClient]);

  // Récupération optimisée du nombre total d'images
  const fetchTotalCount = useCallback(async (
    searchQuery: string,
    tagFilter: string,
    activeTab: string,
    selectedClient: string | null,
    selectedProject: string | null,
    userRole: string,
    userClientId: string | null,
    currentTotalCount: number,
    setTotalCount: (count: number) => void
  ) => {
    if (isCountFetchingRef.current) return currentTotalCount;
    isCountFetchingRef.current = true;
    
    try {
      const count = await fetchTotalImageCount(
        searchQuery,
        tagFilter,
        activeTab,
        selectedClient,
        selectedProject,
        userRole,
        userClientId
      );
      
      setTotalCount(count);
      isCountFetchingRef.current = false;
      return count;
    } catch (error) {
      console.error('Error fetching count:', error);
      isCountFetchingRef.current = false;
      return currentTotalCount;
    }
  }, []);

  // Préchargement de la page suivante si nécessaire
  const prefetchNextPage = useCallback((
    isLoading: boolean,
    isFetching: boolean,
    shouldFetchRandom: boolean,
    searchQuery: string, 
    tagFilter: string, 
    activeTab: string, 
    selectedClient: string | null,
    selectedProject: string | null, 
    page: number,
    totalCount: number,
    userRole: string,
    userClientId: string | null
  ) => {
    // Éviter de précharger pendant le chargement ou si c'est aléatoire
    if (isLoading || isFetching || shouldFetchRandom) return;
    
    const maxPage = Math.ceil(totalCount / 50);
    if (page < maxPage) {
      // Précharger la page suivante pour une navigation plus fluide
      const nextPageKey = generateCacheKey(
        searchQuery, 
        tagFilter, 
        activeTab, 
        selectedClient,
        selectedProject, 
        page + 1, 
        false,
        userRole,
        userClientId
      );
      
      // Vérifier si elle est déjà en cache
      const cachedData = queryClient.getQueryData(nextPageKey);
      if (!cachedData) {
        console.log('Prefetching next page data (page', page + 1, ')');
        queryClient.prefetchQuery({
          queryKey: nextPageKey,
          queryFn: () => import('@/services/galleryService').then(({ fetchGalleryImages }) => 
            fetchGalleryImages(
              searchQuery, 
              tagFilter, 
              activeTab, 
              selectedClient,
              selectedProject, 
              page + 1, 
              false,
              userRole,
              userClientId
            )
          ),
          staleTime: 30 * 60 * 1000 // 30 minutes
        });
      }
    }
  }, [queryClient]);

  return {
    cancelPreviousRequest,
    setPreviousRequest,
    fetchTotalCount,
    prefetchNextPage
  };
};
