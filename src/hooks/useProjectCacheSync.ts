
import { useEffect } from 'react';
import { useGalleryCacheSync } from './gallery/useGalleryCacheSync';

export const useProjectCacheSync = () => {
  const { invalidateGalleryCaches } = useGalleryCacheSync();

  // Fonction pour invalider les caches après des changements de projets
  const syncAfterProjectChange = async (clientId?: string) => {
    console.log('Syncing caches after project change...');
    
    // Attendre un peu pour laisser les données se propager
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Invalider tous les caches de galerie
    await invalidateGalleryCaches(clientId);
    
    console.log('Cache sync completed after project change');
  };

  // Écouter les événements de changement de projets (custom events)
  useEffect(() => {
    const handleProjectChange = (event: CustomEvent) => {
      const { clientId } = event.detail || {};
      syncAfterProjectChange(clientId);
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
