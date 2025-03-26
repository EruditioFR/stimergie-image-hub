
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

  // Récupération simplifiée du nombre total d'images
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

  // Version simplifiée sans préchargement
  const prefetchNextPage = useCallback(() => {
    // Fonction simplifiée qui ne fait rien maintenant que le cache est supprimé
    console.log("Prefetch disabled: caching system removed");
    return;
  }, []);

  return {
    cancelPreviousRequest,
    setPreviousRequest,
    fetchTotalCount,
    prefetchNextPage
  };
};
