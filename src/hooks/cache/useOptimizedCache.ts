/**
 * Optimized Cache Hook - Phase 2: Strategy Optimization
 * Replaces all existing cache hooks with unified, optimized caching
 */

import { useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { useCallback, useEffect } from 'react';
import { unifiedCacheManager, CACHE_CONFIG } from '@/lib/cache/UnifiedCacheManager';
import { getCacheInvalidationService } from '@/lib/cache/CacheInvalidationService';

// Cache key builders - standardized across the app
export const cacheKeys = {
  galleryImages: (search: string, tag: string, tab: string, client: string | null, project: string | null, page: number, userRole: string, userClientId: string | null) => 
    ['gallery-images', search, tag, tab, client, project, page, userRole, userClientId],
  
  projects: (clientId?: string) => 
    clientId ? ['projects', clientId] : ['projects'],
  
  clients: () => ['clients'],
  
  userProfile: (userId: string) => ['user-profile', userId],
  
  imageCount: (search: string, tag: string, tab: string, client: string | null, project: string | null, userRole: string, userClientId: string | null) =>
    ['image-count', search, tag, tab, client, project, userRole, userClientId],
  
  accessibleProjects: (userId: string) => ['accessible-projects', userId]
};

// Hook options with intelligent defaults
interface OptimizedCacheOptions<T> extends Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'> {
  cacheTime?: keyof typeof CACHE_CONFIG.TTL;
  backgroundRefresh?: boolean;
  persistData?: boolean;
  retryOnError?: boolean;
}

/**
 * Main optimized cache hook - replaces useQuery with intelligent caching
 */
export function useOptimizedCache<T>(
  queryKey: any[],
  queryFn: () => Promise<T>,
  options: OptimizedCacheOptions<T> = {}
) {
  const queryClient = useQueryClient();
  const invalidationService = getCacheInvalidationService();
  
  // Determine cache configuration
  const cacheTime = options.cacheTime || 'GALLERY_IMAGES';
  const staleTime = CACHE_CONFIG.TTL[cacheTime];
  
  // Enhanced query options
  const queryOptions: UseQueryOptions<T> = {
    queryKey,
    queryFn,
    staleTime,
    gcTime: staleTime * 2,
    retry: options.retryOnError !== false ? 2 : false,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    ...options
  };

  const query = useQuery(queryOptions);

  // Background refresh management
  useEffect(() => {
    if (options.backgroundRefresh && query.isSuccess && query.isStale) {
      const backgroundRefreshTimer = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey });
      }, staleTime / 2);

      return () => clearTimeout(backgroundRefreshTimer);
    }
  }, [query.isSuccess, query.isStale, options.backgroundRefresh, queryKey, staleTime, queryClient]);

  return query;
}

/**
 * Gallery-specific optimized hook
 */
export function useOptimizedGallery(
  search: string,
  tag: string,
  tab: string,
  client: string | null,
  project: string | null,
  page: number,
  userRole: string,
  userClientId: string | null,
  fetchFn: () => Promise<any>
) {
  const queryKey = cacheKeys.galleryImages(search, tag, tab, client, project, page, userRole, userClientId);
  
  return useOptimizedCache(queryKey, fetchFn, {
    cacheTime: 'GALLERY_IMAGES',
    backgroundRefresh: true,
    staleTime: CACHE_CONFIG.TTL.GALLERY_IMAGES,
    enabled: true,
    retry: 2
  });
}

/**
 * Projects-specific optimized hook  
 */
export function useOptimizedProjects(
  clientId: string | undefined,
  fetchFn: () => Promise<any>
) {
  const queryKey = cacheKeys.projects(clientId);
  
  return useOptimizedCache(queryKey, fetchFn, {
    cacheTime: 'PROJECT_DATA',
    backgroundRefresh: false,
    staleTime: CACHE_CONFIG.TTL.PROJECT_DATA,
    retry: 1
  });
}

/**
 * Count queries with intelligent caching
 */
export function useOptimizedCount(
  search: string,
  tag: string,
  tab: string,
  client: string | null,
  project: string | null,
  userRole: string,
  userClientId: string | null,
  fetchFn: () => Promise<number>
) {
  const queryKey = cacheKeys.imageCount(search, tag, tab, client, project, userRole, userClientId);
  
  return useOptimizedCache(queryKey, fetchFn, {
    cacheTime: 'METADATA',
    backgroundRefresh: false,
    staleTime: CACHE_CONFIG.TTL.METADATA,
    retry: 1
  });
}

/**
 * Cache management hook - provides cache control methods
 */
export function useCacheManagement() {
  const queryClient = useQueryClient();
  const invalidationService = getCacheInvalidationService();

  const clearGalleryCache = useCallback(async (projectId?: string, clientId?: string) => {
    await invalidationService.invalidateGallery(projectId, clientId);
  }, [invalidationService]);

  const clearProjectsCache = useCallback(async (clientId?: string) => {
    await invalidationService.invalidateProjects(clientId);
  }, [invalidationService]);

  const forceRefresh = useCallback(async () => {
    await invalidationService.forceFullRefresh();
  }, [invalidationService]);

  const getCacheDiagnostics = useCallback(() => {
    return unifiedCacheManager.getDiagnostics();
  }, []);

  const emergencyClear = useCallback(() => {
    unifiedCacheManager.emergencyClear();
  }, []);

  // Prefetch functions for performance
  const prefetchGalleryImages = useCallback(async (
    search: string,
    tag: string,
    tab: string,
    client: string | null,
    project: string | null,
    page: number,
    userRole: string,
    userClientId: string | null,
    fetchFn: () => Promise<any>
  ) => {
    const queryKey = cacheKeys.galleryImages(search, tag, tab, client, project, page, userRole, userClientId);
    
    await queryClient.prefetchQuery({
      queryKey,
      queryFn: fetchFn,
      staleTime: CACHE_CONFIG.TTL.GALLERY_IMAGES
    });
  }, [queryClient]);

  return {
    // Cache clearing
    clearGalleryCache,
    clearProjectsCache,
    forceRefresh,
    emergencyClear,
    
    // Diagnostics
    getCacheDiagnostics,
    
    // Performance
    prefetchGalleryImages
  };
}

/**
 * Cache health monitoring hook
 */
export function useCacheMonitoring() {
  const queryClient = useQueryClient();

  const getHealthMetrics = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const healthMetrics = {
      totalQueries: queries.length,
      staleQueries: queries.filter(q => q.isStale()).length,
      errorQueries: queries.filter(q => q.state.status === 'error').length,
      loadingQueries: queries.filter(q => q.state.status === 'pending').length,
      successQueries: queries.filter(q => q.state.status === 'success').length,
      cacheHitRate: 0,
      memoryUsage: 0
    };

    // Calculate cache hit rate (approximation)
    const successRate = healthMetrics.successQueries / Math.max(healthMetrics.totalQueries, 1);
    healthMetrics.cacheHitRate = Math.round(successRate * 100);

    // Get memory usage if available (Chrome-specific API)
    const perfMemory = (performance as any).memory;
    if (perfMemory?.usedJSHeapSize) {
      healthMetrics.memoryUsage = Math.round(perfMemory.usedJSHeapSize / 1024 / 1024);
    }

    return healthMetrics;
  }, [queryClient]);

  const isHealthy = useCallback(() => {
    const metrics = getHealthMetrics();
    return metrics.errorQueries < 5 && metrics.cacheHitRate > 70;
  }, [getHealthMetrics]);

  return {
    getHealthMetrics,
    isHealthy
  };
}