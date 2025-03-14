
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { fetchGalleryImages, GALLERY_CACHE_TIME, generateCacheKey } from '@/services/galleryService';
import { formatImagesForGrid } from '@/utils/imageUtils';
import { useGalleryFilters } from './useGalleryFilters';
import { Image } from '@/pages/Images';

export const useGalleryImages = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [page, setPage] = useState(1);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const previousRequestRef = useRef<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Import filter management
  const {
    activeTab,
    selectedClient,
    hasActiveFilters,
    handleTabChange,
    handleClientChange: baseHandleClientChange,
    handleResetFilters,
    updateFilterStatus
  } = useGalleryFilters();

  // Create a cache key based on current filters
  const cacheKey = useCallback(() => {
    return generateCacheKey(searchQuery, tagFilter, activeTab, selectedClient, page, isAdmin, isInitialLoad);
  }, [searchQuery, tagFilter, activeTab, selectedClient, page, isAdmin, isInitialLoad]);

  // Override client change handler to reset pagination and cancel any previous requests
  const handleClientChange = useCallback((clientId: string | null) => {
    // Cancel previous requests by invalidating the cache
    if (previousRequestRef.current) {
      // We don't want to refetch, just invalidate
      queryClient.cancelQueries({ queryKey: previousRequestRef.current.split(',') });
    }
    
    // Update client filter
    baseHandleClientChange(clientId);
    
    // Reset page to 1 when client changes
    setPage(1);
    setAllImages([]);
    
    // No longer initial load
    setIsInitialLoad(false);
    
    // Set new request reference
    previousRequestRef.current = generateCacheKey(searchQuery, tagFilter, activeTab, clientId, 1, isAdmin, false).join(',');
  }, [baseHandleClientChange, searchQuery, tagFilter, activeTab, queryClient, isAdmin]);

  // Prefetch next page when current page is loaded
  useEffect(() => {
    if (page > 0) {
      const nextPageKey = generateCacheKey(searchQuery, tagFilter, activeTab, selectedClient, page + 1, isAdmin, false);
      queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn: () => fetchGalleryImages(searchQuery, tagFilter, activeTab, selectedClient, page + 1, isAdmin, false),
        staleTime: GALLERY_CACHE_TIME,
      });
    }
  }, [queryClient, page, searchQuery, tagFilter, activeTab, selectedClient, isAdmin]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(false);
    
    // Update filter status
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus]);

  // When selectedClient changes, we reset and start fresh
  useEffect(() => {
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(false);
  }, [selectedClient]);

  // Fetch images from Supabase with caching
  const { data: newImages = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: cacheKey(),
    queryFn: () => fetchGalleryImages(searchQuery, tagFilter, activeTab, selectedClient, page, isAdmin, isInitialLoad),
    staleTime: GALLERY_CACHE_TIME,
    gcTime: GALLERY_CACHE_TIME * 2, // Keep in cache twice as long
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    enabled: true, // Always enabled, we'll handle manual invalidation
  });

  // Add newly loaded images to our collection
  useEffect(() => {
    console.log('New images loaded:', newImages.length);
    if (newImages.length > 0) {
      if (page === 1) {
        setAllImages(newImages);
      } else {
        // Ensure we don't add duplicates
        const newImageIds = new Set(newImages.map(img => img.id));
        const filteredExistingImages = allImages.filter(img => !newImageIds.has(img.id));
        setAllImages([...filteredExistingImages, ...newImages]);
      }
    } else if (page === 1) {
      // If we're on the first page and there are no images, empty the collection
      setAllImages([]);
    }
    
    // After first load, set initialLoad to false
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [newImages, page, isInitialLoad]);

  // Handle loading more images
  const loadMoreImages = useCallback(() => {
    if (!isLoading && !isFetching && newImages.length === 15) { // 15 is the IMAGES_PER_PAGE constant
      setPage(prev => prev + 1);
    }
  }, [isLoading, isFetching, newImages.length]);

  // Invalidate cache and force refresh
  const refreshGallery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(true);
    refetch();
  }, [queryClient, refetch]);

  return {
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
    formatImagesForGrid
  };
};
