import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { clearImageCachesOnly } from '@/utils/image/smartCacheManager';
import { useSmartCacheInvalidation } from '@/hooks/useSmartCacheInvalidation';

interface UseGalleryStateProps {
  refreshGallery: () => void;
  selectedProject: string | null;
  selectedClient: string | null;
}

export const useGalleryState = ({ 
  refreshGallery, 
  selectedProject, 
  selectedClient 
}: UseGalleryStateProps) => {
  const [isFlushing, setIsFlushing] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [infiniteScrollEnabled, setInfiniteScrollEnabled] = useState(false);
  const [accumulatedImages, setAccumulatedImages] = useState<any[]>([]);
  const pageLoadTimeRef = useRef(Date.now());

  const { invalidateImageCaches, forceRefreshProject } = useSmartCacheInvalidation();

  const handleSmartFlushCache = useCallback(async () => {
    setIsFlushing(true);
    try {
      console.log('🧹 Smart cache flush starting...');
      
      clearImageCachesOnly();
      await invalidateImageCaches(selectedProject, selectedClient);
      
      toast.success('Cache d\'images vidé intelligemment', {
        description: 'Session utilisateur préservée. Images rechargées depuis le serveur.'
      });

      setTimeout(() => {
        refreshGallery();
      }, 500);
      
    } catch (error) {
      console.error('Error during smart cache flush:', error);
      toast.error('Erreur lors du vidage intelligent du cache');
    } finally {
      setIsFlushing(false);
    }
  }, [refreshGallery, invalidateImageCaches, selectedProject, selectedClient]);

  const handleForceRefreshProject = useCallback(async () => {
    if (!selectedProject) {
      toast.error('Aucun projet sélectionné');
      return;
    }
    
    setIsFlushing(true);
    try {
      console.log(`🔄 Force refreshing project: ${selectedProject}`);
      
      await forceRefreshProject(selectedProject);
      
      toast.success('Projet actualisé avec succès', {
        description: 'Toutes les données ont été rechargées depuis la base.'
      });
      
      setTimeout(() => {
        refreshGallery();
      }, 300);
      
    } catch (error) {
      console.error('Error force refreshing project:', error);
      toast.error('Erreur lors de l\'actualisation du projet');
    } finally {
      setIsFlushing(false);
    }
  }, [selectedProject, forceRefreshProject, refreshGallery]);

  return {
    isFlushing,
    showDebugPanel,
    infiniteScrollEnabled,
    accumulatedImages,
    pageLoadTimeRef,
    setShowDebugPanel,
    setInfiniteScrollEnabled,
    setAccumulatedImages,
    handleSmartFlushCache,
    handleForceRefreshProject
  };
};
