/**
 * Optimized Gallery Hook - Migration to unified cache system
 * Replaces existing gallery hooks with optimized caching
 */

import { useOptimizedGallery, useCacheManagement } from '@/hooks/cache/useOptimizedCache';
import { fetchGalleryImages } from '@/services/gallery/imageService';
import { useCallback, useState, useEffect } from 'react';

export interface OptimizedGalleryProps {
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  selectedOrientation: string | null;
  page: number;
  randomMode: boolean;
  userRole: string;
  userClientId: string | null;
}

export const useGalleryOptimized = (props: OptimizedGalleryProps) => {
  const {
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    page,
    randomMode,
    userRole,
    userClientId
  } = props;

  const [accumulatedImages, setAccumulatedImages] = useState<any[]>([]);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Cache management
  const { clearGalleryCache, prefetchGalleryImages } = useCacheManagement();

  // Optimized fetch function
  const fetchFunction = useCallback(() => {
    return fetchGalleryImages(
      searchQuery,
      tagFilter,
      activeTab,
      selectedClient,
      selectedProject,
      page,
      randomMode,
      userRole,
      userClientId,
      selectedOrientation
    );
  }, [searchQuery, tagFilter, activeTab, selectedClient, selectedProject, page, randomMode, userRole, userClientId, selectedOrientation]);

  // Use optimized cache hook
  const query = useOptimizedGallery(
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    page,
    userRole,
    userClientId,
    fetchFunction
  );

  // Handle data accumulation for infinite scroll
  useEffect(() => {
    if (query.data) {
      const { images = [], totalPages = 0 } = query.data;
      
      if (page === 1) {
        // First page - reset accumulated images
        setAccumulatedImages(images);
      } else {
        // Subsequent pages - append to accumulated images
        setAccumulatedImages(prev => {
          const newImages = images.filter(
            (img: any) => !prev.some(prevImg => prevImg.id === img.id)
          );
          return [...prev, ...newImages];
        });
      }
      
      // Update pagination state
      setHasMorePages(page < totalPages);
    }
  }, [query.data, page]);

  // Reset accumulated images when filters change
  useEffect(() => {
    if (page === 1) {
      setAccumulatedImages([]);
      setHasMorePages(true);
    }
  }, [searchQuery, tagFilter, activeTab, selectedClient, selectedProject, selectedOrientation, page]);

  // Prefetch next page for better UX
  useEffect(() => {
    if (query.data && hasMorePages && !query.isFetching) {
      const nextPageFetch = () => fetchGalleryImages(
        searchQuery,
        tagFilter,
        activeTab,
        selectedClient,
        selectedProject,
        page + 1,
        randomMode,
        userRole,
        userClientId,
        selectedOrientation
      );

      prefetchGalleryImages(
        searchQuery,
        tagFilter,
        activeTab,
        selectedClient,
        selectedProject,
        page + 1,
        userRole,
        userClientId,
        nextPageFetch
      );
    }
  }, [query.data, hasMorePages, query.isFetching, prefetchGalleryImages, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, page, randomMode, userRole, userClientId, selectedOrientation]);

  // Refresh function with cache invalidation
  const refreshGallery = useCallback(async () => {
    await clearGalleryCache(selectedProject || undefined, selectedClient || undefined);
    setAccumulatedImages([]);
    setHasMorePages(true);
    return query.refetch();
  }, [clearGalleryCache, selectedProject, selectedClient, query.refetch]);

  return {
    // Data
    allImages: accumulatedImages,
    currentPageImages: query.data?.images || [],
    totalImages: query.data?.totalImages || 0,
    totalPages: query.data?.totalPages || 0,
    
    // States
    isLoading: query.isPending,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    hasMorePages,
    
    // Actions
    refreshGallery,
    
    // Cache info (for debugging)
    cacheStatus: query.status,
    dataUpdatedAt: query.dataUpdatedAt,
    isStale: query.isStale
  };
};