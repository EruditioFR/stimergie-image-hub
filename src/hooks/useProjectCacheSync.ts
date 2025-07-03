
import { useEffect } from 'react';
import { useSmartCacheInvalidation } from './useSmartCacheInvalidation';

export const useProjectCacheSync = () => {
  const { invalidateImageCaches } = useSmartCacheInvalidation();

  // Fonction pour invalider intelligemment les caches après des changements de projets
  const syncAfterProjectChange = async (clientId?: string, projectId?: string) => {
    console.log('🔄 Smart sync after project change...', { clientId, projectId });
    
    // Attendre un peu pour laisser les données se propager
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Invalider intelligemment les caches (préserve l'auth)
    await invalidateImageCaches(projectId, clientId);
    
    console.log('✅ Smart cache sync completed after project change');
  };

  // Écouter les événements de changement de projets (custom events)
  useEffect(() => {
    const handleProjectChange = (event: CustomEvent) => {
      const { clientId, projectId } = event.detail || {};
      syncAfterProjectChange(clientId, projectId);
    };

    window.addEventListener('projectAdded', handleProjectChange as EventListener);
    window.addEventListener('projectUpdated', handleProjectChange as EventListener);
    window.addEventListener('projectDeleted', handleProjectChange as EventListener);

    return () => {
      window.removeEventListener('projectAdded', handleProjectChange as EventListener);
      window.removeEventListener('projectUpdated', handleProjectChange as EventListener);
      window.removeEventListener('projectDeleted', handleProjectChange as EventListener);
    };
  }, []);

  return {
    syncAfterProjectChange
  };
};
