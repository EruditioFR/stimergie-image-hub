
import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchTotalImagesCount } from '@/services/gallery/countService';
import { fetchGalleryImages } from '@/services/gallery/imageService';
import { clearAllCaches } from '@/utils/image/cacheManager';

export const useGalleryCache = () => {
  const queryClient = useQueryClient();
  const previousRequestRef = useRef<AbortController | null>(null);
  
  // Cancel previous request if it exists
  const cancelPreviousRequest = useCallback(() => {
    if (previousRequestRef.current) {
      console.log('Cancelling previous request');
      previousRequestRef.current.abort();
      previousRequestRef.current = null;
    }
  }, []);
  
  // Set up a new request and keep its controller
  const setPreviousRequest = useCallback((
    searchQuery: string, 
    tagFilter: string, 
    activeTab: string, 
    selectedClient: string | null, 
    selectedProject: string | null,
    selectedOrientation: string | null,
    page: number, 
    randomMode: boolean,
    userRole: string,
    userClientId: string | null
  ) => {
    cancelPreviousRequest();
    
    const controller = new AbortController();
    previousRequestRef.current = controller;
    
    return controller.signal;
  }, [cancelPreviousRequest]);
  
  // Fetch total count for current filters
  const fetchTotalCount = useCallback(async (
    searchQuery: string, 
    tagFilter: string, 
    activeTab: string, 
    client: string | null, 
    project: string | null,
    orientation: string | null,
    userRole: string,
    userClientId: string | null
  ) => {
    try {
      const count = await fetchTotalImagesCount(
        searchQuery, 
        tagFilter, 
        activeTab, 
        client, 
        project,
        orientation,
        userRole,
        userClientId
      );
      
      queryClient.setQueryData(
        [
          'gallery-images-count', 
          searchQuery, 
          tagFilter, 
          activeTab, 
          client, 
          project,
          orientation,
          userRole,
          userClientId
        ], 
        count
      );
      
      return count;
    } catch (error) {
      console.error('Error fetching total count:', error);
      return 0;
    }
  }, [queryClient]);
  
  // Prefetch next page data
  const prefetchNextPage = useCallback(async (
    searchQuery: string, 
    tagFilter: string, 
    activeTab: string, 
    client: string | null, 
    project: string | null,
    orientation: string | null,
    page: number,
    userRole: string,
    userClientId: string | null
  ) => {
    try {
      // Prefetch the next page of data
      await queryClient.prefetchQuery({
        queryKey: [
          'gallery-images', 
          searchQuery, 
          tagFilter, 
          activeTab, 
          client, 
          project,
          orientation,
          page, 
          false, // Force no random images on prefetch
          userRole,
          userClientId
        ],
        queryFn: () => fetchGalleryImages(
          searchQuery, 
          tagFilter, 
          activeTab, 
          client, 
          project, 
          page, 
          false,
          userRole,
          userClientId,
          orientation
        ),
        staleTime: 60000, // 1 minute
      });
    } catch (error) {
      console.error('Error prefetching next page:', error);
    }
  }, [queryClient]);
  
  // Nouvelle méthode pour invalider les caches de galerie
  const invalidateGalleryData = useCallback(async () => {
    console.log('Invalidating all gallery data caches...');
    
    try {
      // Invalider toutes les requêtes de galerie
      await queryClient.invalidateQueries({
        queryKey: ['gallery-images'],
        exact: false
      });
      
      await queryClient.invalidateQueries({
        queryKey: ['gallery-images-count'],
        exact: false
      });
      
      // Vider les caches d'images
      clearAllCaches();
      
      console.log('Gallery data cache invalidation completed');
    } catch (error) {
      console.error('Error invalidating gallery data:', error);
    }
  }, [queryClient]);
  
  // Nouvelle méthode pour invalider les caches spécifiques à un client
  const invalidateClientData = useCallback(async (clientId: string) => {
    console.log(`Invalidating client-specific data for: ${clientId}`);
    
    try {
      // Invalider toutes les requêtes qui pourraient contenir des données de ce client
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          return queryKey.some(key => 
            typeof key === 'string' && key.includes(clientId)
          ) || queryKey.includes('gallery-images') || queryKey.includes('gallery-images-count');
        }
      });
      
      // Vider le cache d'images
      clearAllCaches();
      
      console.log(`Client-specific cache invalidation completed for ${clientId}`);
    } catch (error) {
      console.error(`Error invalidating client data for ${clientId}:`, error);
    }
  }, [queryClient]);
  
  return {
    cancelPreviousRequest,
    setPreviousRequest,
    fetchTotalCount,
    prefetchNextPage,
    invalidateGalleryData,
    invalidateClientData
  };
};
