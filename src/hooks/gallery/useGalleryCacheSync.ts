
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { clearAllCaches } from '@/utils/image/cacheManager';

export const useGalleryCacheSync = () => {
  const queryClient = useQueryClient();

  const invalidateGalleryCaches = useCallback(async (clientId?: string) => {
    console.log('Starting gallery cache invalidation...', clientId ? `for client ${clientId}` : 'for all clients');
    
    try {
      // 1. Invalider toutes les requêtes de galerie dans React Query
      await queryClient.invalidateQueries({
        queryKey: ['gallery-images'],
        exact: false
      });
      
      await queryClient.invalidateQueries({
        queryKey: ['gallery-images-count'],
        exact: false
      });
      
      // 2. Vider tous les caches d'images
      clearAllCaches();
      
      // 3. Invalider les projets pour rafraîchir les filtres
      await queryClient.invalidateQueries({
        queryKey: ['projects'],
        exact: false
      });
      
      console.log('Gallery cache invalidation completed successfully');
    } catch (error) {
      console.error('Error during gallery cache invalidation:', error);
    }
  }, [queryClient]);

  const invalidateClientSpecificCaches = useCallback(async (clientId: string) => {
    console.log(`Invalidating caches for client: ${clientId}`);
    
    try {
      // Invalider toutes les requêtes qui pourraient contenir des données pour ce client
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const queryKey = query.queryKey;
          // Vérifier si la requête contient l'ID du client
          return queryKey.includes(clientId) || 
                 queryKey.includes('gallery-images') || 
                 queryKey.includes('gallery-images-count');
        }
      });
      
      // Vider le cache d'images
      clearAllCaches();
      
      console.log(`Client-specific cache invalidation completed for ${clientId}`);
    } catch (error) {
      console.error(`Error during client-specific cache invalidation for ${clientId}:`, error);
    }
  }, [queryClient]);

  return {
    invalidateGalleryCaches,
    invalidateClientSpecificCaches
  };
};
