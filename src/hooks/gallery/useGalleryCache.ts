import { useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchTotalImagesCount } from '@/services/gallery/countService';
import { fetchGalleryImages } from '@/services/gallery/imageService';

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
  
  return {
    cancelPreviousRequest,
    setPreviousRequest,
    fetchTotalCount,
    prefetchNextPage
  };
};
