
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearAllCaches } from '@/utils/image/cacheManager';

export const useSmartCacheInvalidation = () => {
  const queryClient = useQueryClient();

  // Invalider seulement les caches d'images, pas l'auth
  const invalidateImageCaches = useCallback(async (projectId?: string, clientId?: string) => {
    console.log('🧹 Smart cache invalidation starting...', { projectId, clientId });
    
    try {
      // 1. Invalider les requêtes React Query liées aux images
      const predicates = [];
      
      // Requêtes générales d'images
      predicates.push((query: any) => {
        const key = JSON.stringify(query.queryKey);
        return key.includes('gallery') || key.includes('images');
      });
      
      // Requêtes spécifiques au projet si spécifié
      if (projectId) {
        predicates.push((query: any) => {
          const key = JSON.stringify(query.queryKey);
          return key.includes(projectId);
        });
      }
      
      // Requêtes spécifiques au client si spécifié
      if (clientId) {
        predicates.push((query: any) => {
          const key = JSON.stringify(query.queryKey);
          return key.includes(clientId);
        });
      }
      
      // Invalider avec tous les prédicats
      for (const predicate of predicates) {
        await queryClient.invalidateQueries({ predicate });
      }
      
      // 2. Vider les caches d'images physiques
      clearAllCaches();
      
      // 3. Invalider les projets pour rafraîchir les filtres
      await queryClient.invalidateQueries({
        queryKey: ['projects'],
        exact: false
      });
      
      console.log('✅ Smart cache invalidation completed');
      
    } catch (error) {
      console.error('❌ Error during smart cache invalidation:', error);
      throw error;
    }
  }, [queryClient]);

  // Forcer un refresh complet d'un projet spécifique
  const forceRefreshProject = useCallback(async (projectId: string) => {
    console.log(`🔄 Force refreshing project: ${projectId}`);
    
    try {
      // Invalider toutes les requêtes liées à ce projet
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = JSON.stringify(query.queryKey);
          return key.includes(projectId);
        }
      });
      
      // Vider complètement les caches
      clearAllCaches();
      
      // Précharger la première page du projet
      const { fetchGalleryImages } = await import('@/services/gallery/imageService');
      await queryClient.prefetchQuery({
        queryKey: ['gallery-images', '', '', 'all', null, projectId, 1, false, 'admin', null],
        queryFn: () => fetchGalleryImages('', '', 'all', null, projectId, 1, false, 'admin', null, null),
        staleTime: 0 // Force fresh data
      });
      
      console.log(`✅ Project ${projectId} force refresh completed`);
      
    } catch (error) {
      console.error(`❌ Error force refreshing project ${projectId}:`, error);
      throw error;
    }
  }, [queryClient]);

  // Diagnostic des clés de cache
  const diagnoseCache = useCallback(() => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const galleryQueries = queries.filter(q => {
      const key = JSON.stringify(q.queryKey);
      return key.includes('gallery') || key.includes('images');
    });
    
    console.log('📊 Cache diagnosis:');
    console.log(`Total queries: ${queries.length}`);
    console.log(`Gallery queries: ${galleryQueries.length}`);
    
    galleryQueries.forEach(q => {
      console.log(`Query: ${JSON.stringify(q.queryKey)}, State: ${q.state.status}, Data: ${q.state.data ? 'Present' : 'None'}`);
    });
    
    return {
      totalQueries: queries.length,
      galleryQueries: galleryQueries.length,
      queries: galleryQueries.map(q => ({
        key: q.queryKey,
        status: q.state.status,
        hasData: !!q.state.data
      }))
    };
  }, [queryClient]);

  return {
    invalidateImageCaches,
    forceRefreshProject,
    diagnoseCache
  };
};
