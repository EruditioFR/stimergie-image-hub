
import { useState, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Image } from '@/utils/image/types';
import { fetchGalleryImages, generateCacheKey } from '@/services/galleryService';

const EXTENDED_CACHE_TIME = 30 * 60 * 1000; // 30 minutes

interface GalleryQueryProps {
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  currentPage: number;
  shouldFetchRandom: boolean;
  userRole: string;
  userClientId: string | null;
}

export const useGalleryQueryState = ({
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  currentPage,
  shouldFetchRandom,
  userRole,
  userClientId
}: GalleryQueryProps) => {
  const queryClient = useQueryClient();
  const [allImages, setAllImages] = useState<Image[]>([]);

  // Génération optimisée de la clé de cache
  const cacheKey = useCallback(() => {
    return generateCacheKey(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      selectedProject, 
      currentPage, 
      shouldFetchRandom,
      userRole,
      userClientId
    );
  }, [searchQuery, tagFilter, activeTab, selectedClient, selectedProject, currentPage, shouldFetchRandom, userRole, userClientId]);

  // Requête principale optimisée avec mode pagination
  const { data: newImages = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: cacheKey(),
    queryFn: () => fetchGalleryImages(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      selectedProject, 
      currentPage, 
      shouldFetchRandom,
      userRole,
      userClientId
    ),
    staleTime: EXTENDED_CACHE_TIME,
    gcTime: EXTENDED_CACHE_TIME * 2,
    refetchOnWindowFocus: false,
    enabled: true
  });

  // Traitement des nouvelles images
  useEffect(() => {
    console.log('New images loaded for page', currentPage, newImages.length);
    
    if (newImages.length > 0) {
      // En mode pagination stricte, on remplace complètement les images à chaque changement
      setAllImages(newImages);
    } else {
      setAllImages([]);
    }
  }, [newImages, currentPage]);

  // Rafraîchissement optimisé de la galerie
  const refreshGallery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    
    const noFilters = !searchQuery && !tagFilter && activeTab === 'all' && !selectedProject;
    const canUseRandom = noFilters && (userRole === 'admin' || selectedClient !== null);
    
    refetch();
  }, [queryClient, refetch, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, userRole]);

  return {
    allImages,
    isLoading,
    isFetching,
    refetch,
    refreshGallery
  };
};
