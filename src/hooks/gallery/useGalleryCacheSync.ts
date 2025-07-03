
import { useCallback } from 'react';
import { useSmartCacheInvalidation } from '../useSmartCacheInvalidation';

export const useGalleryCacheSync = () => {
  const { invalidateImageCaches } = useSmartCacheInvalidation();

  const invalidateGalleryCaches = useCallback(async (clientId?: string, projectId?: string) => {
    console.log('🔄 Gallery cache sync starting...', clientId ? `for client ${clientId}` : 'for all');
    
    try {
      // Utiliser le système d'invalidation intelligent
      await invalidateImageCaches(projectId, clientId);
      
      console.log('✅ Gallery cache sync completed successfully');
    } catch (error) {
      console.error('❌ Error during gallery cache sync:', error);
    }
  }, [invalidateImageCaches]);

  const invalidateClientSpecificCaches = useCallback(async (clientId: string) => {
    console.log(`🔄 Invalidating caches for client: ${clientId}`);
    
    try {
      // Utiliser le système d'invalidation intelligent spécifique au client
      await invalidateImageCaches(undefined, clientId);
      
      console.log(`✅ Client-specific cache invalidation completed for ${clientId}`);
    } catch (error) {
      console.error(`❌ Error during client-specific cache invalidation for ${clientId}:`, error);
    }
  }, [invalidateImageCaches]);

  return {
    invalidateGalleryCaches,
    invalidateClientSpecificCaches
  };
};
