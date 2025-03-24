
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  fetchGalleryImages, 
  GALLERY_CACHE_TIME, 
  generateCacheKey,
  fetchTotalImageCount
} from '@/services/galleryService';
import { formatImagesForGrid } from '@/utils/imageUtils';
import { useGalleryFilters } from './useGalleryFilters';
import { Image } from '@/pages/Images';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const EXTENDED_CACHE_TIME = 30 * 60 * 1000; // 30 minutes

export const useGalleryImages = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [page, setPage] = useState(1);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const previousRequestRef = useRef<string | null>(null);
  const [shouldFetchRandom, setShouldFetchRandom] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const isCountFetchingRef = useRef(false);
  const { userRole, user } = useAuth();
  const [userClientId, setUserClientId] = useState<string | null>(null);
  const userClientFetchedRef = useRef(false);
  
  // Récupérer le client_id de l'utilisateur une seule fois
  useEffect(() => {
    const fetchUserClientId = async () => {
      if (!user || userClientFetchedRef.current) return;
      
      const cachedClientId = sessionStorage.getItem(`userClientId-${user.id}`);
      if (cachedClientId) {
        setUserClientId(cachedClientId);
        console.log('Using cached user client ID:', cachedClientId);
        userClientFetchedRef.current = true;
        return;
      }
      
      try {
        const { data, error } = await supabase.rpc('get_user_client_id', {
          user_id: user.id
        });
        
        if (error) {
          console.error('Error fetching user client ID:', error);
          return;
        }
        
        if (data) {
          sessionStorage.setItem(`userClientId-${user.id}`, data);
          setUserClientId(data);
          console.log('User client ID fetched and cached:', data);
          userClientFetchedRef.current = true;
        }
      } catch (error) {
        console.error('Error fetching user client ID:', error);
      }
    };
    
    fetchUserClientId();
  }, [user]);

  const {
    activeTab,
    selectedClient,
    selectedProject,
    hasActiveFilters,
    handleTabChange,
    handleClientChange: baseHandleClientChange,
    handleProjectChange: baseHandleProjectChange,
    handleResetFilters,
    updateFilterStatus
  } = useGalleryFilters();

  // Génération optimisée de la clé de cache
  const cacheKey = useCallback(() => {
    return generateCacheKey(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      selectedProject, 
      page, 
      shouldFetchRandom,
      userRole,
      userClientId
    );
  }, [searchQuery, tagFilter, activeTab, selectedClient, selectedProject, page, shouldFetchRandom, userRole, userClientId]);

  // Gestionnaire de changement de client optimisé
  const handleClientChange = useCallback((clientId: string | null) => {
    if (['admin_client', 'user'].includes(userRole) && userClientId) {
      console.log('Non-admin users cannot change their client filter');
      return;
    }
    
    if (previousRequestRef.current) {
      queryClient.cancelQueries({ queryKey: previousRequestRef.current.split(',') });
    }
    
    baseHandleClientChange(clientId);
    
    setShouldFetchRandom(false);
    setPage(1);
    
    previousRequestRef.current = generateCacheKey(
      searchQuery, 
      tagFilter, 
      activeTab, 
      clientId,
      null, 
      1, 
      false,
      userRole,
      userClientId
    ).join(',');
  }, [baseHandleClientChange, searchQuery, tagFilter, activeTab, queryClient, userRole, userClientId]);
  
  // Gestionnaire de changement de projet optimisé
  const handleProjectChange = useCallback((projectId: string | null) => {
    if (previousRequestRef.current) {
      queryClient.cancelQueries({ queryKey: previousRequestRef.current.split(',') });
    }
    
    baseHandleProjectChange(projectId);
    
    setShouldFetchRandom(false);
    setPage(1);
    
    previousRequestRef.current = generateCacheKey(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      projectId, 
      1, 
      false,
      userRole,
      userClientId
    ).join(',');
  }, [baseHandleProjectChange, searchQuery, tagFilter, activeTab, selectedClient, queryClient, userRole, userClientId]);

  // Réinitialisation des filtres et optimisation des requêtes
  useEffect(() => {
    setPage(1);
    
    // Modifier pour s'assurer de la récupération aléatoire lors du chargement initial sans filtres
    const noFilters = !searchQuery && !tagFilter && activeTab === 'all' && !selectedProject;
    const canUseRandom = noFilters && (userRole === 'admin' || selectedClient !== null);
    
    console.log('Setting shouldFetchRandom to:', canUseRandom);
    setShouldFetchRandom(canUseRandom);
    
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus, selectedClient, selectedProject, userRole]);

  // Forcer le client_id pour les utilisateurs non-admin
  useEffect(() => {
    if (['admin_client', 'user'].includes(userRole) && userClientId && selectedClient !== userClientId) {
      console.log('Setting client filter to non-admin user client ID:', userClientId);
      baseHandleClientChange(userClientId);
    }
  }, [userRole, userClientId, baseHandleClientChange, selectedClient]);

  // Récupération optimisée du nombre total d'images
  const fetchTotalCount = useCallback(async () => {
    if (isCountFetchingRef.current) return totalCount;
    isCountFetchingRef.current = true;
    
    try {
      const count = await fetchTotalImageCount(
        searchQuery,
        tagFilter,
        activeTab,
        selectedClient,
        selectedProject,
        userRole,
        userClientId
      );
      
      setTotalCount(count);
      isCountFetchingRef.current = false;
      return count;
    } catch (error) {
      console.error('Error fetching count:', error);
      isCountFetchingRef.current = false;
      return totalCount;
    }
  }, [searchQuery, tagFilter, activeTab, selectedClient, selectedProject, totalCount, userRole, userClientId]);

  // Requête principale optimisée avec mode pagination
  const { data: newImages = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: cacheKey(),
    queryFn: () => fetchGalleryImages(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      selectedProject, 
      page, 
      shouldFetchRandom,
      userRole,
      userClientId
    ),
    staleTime: EXTENDED_CACHE_TIME,
    gcTime: EXTENDED_CACHE_TIME * 2,
    refetchOnWindowFocus: false,
    enabled: true
  });

  // Récupération du nombre total optimisée
  useEffect(() => {
    if (isFetching || isLoading) return;
    fetchTotalCount();
  }, [fetchTotalCount, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, isFetching, isLoading]);

  // Traitement des nouvelles images
  useEffect(() => {
    console.log('New images loaded for page', page, newImages.length);
    
    if (newImages.length > 0) {
      // En mode pagination stricte, on remplace complètement les images à chaque changement
      setAllImages(newImages);
    } else {
      setAllImages([]);
    }
  }, [newImages, page]);

  // Préchargement de la page suivante si nécessaire
  useEffect(() => {
    // Éviter de précharger pendant le chargement ou si c'est aléatoire
    if (isLoading || isFetching || shouldFetchRandom) return;
    
    const maxPage = Math.ceil(totalCount / 50);
    if (page < maxPage) {
      // Précharger la page suivante pour une navigation plus fluide
      const nextPageKey = generateCacheKey(
        searchQuery, 
        tagFilter, 
        activeTab, 
        selectedClient,
        selectedProject, 
        page + 1, 
        false,
        userRole,
        userClientId
      );
      
      // Vérifier si elle est déjà en cache
      const cachedData = queryClient.getQueryData(nextPageKey);
      if (!cachedData) {
        console.log('Prefetching next page data (page', page + 1, ')');
        queryClient.prefetchQuery({
          queryKey: nextPageKey,
          queryFn: () => fetchGalleryImages(
            searchQuery, 
            tagFilter, 
            activeTab, 
            selectedClient,
            selectedProject, 
            page + 1, 
            false,
            userRole,
            userClientId
          ),
          staleTime: EXTENDED_CACHE_TIME
        });
      }
    }
  }, [queryClient, page, totalCount, isLoading, isFetching, shouldFetchRandom, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, userRole, userClientId]);

  // Gestionnaire de changement de page optimisé pour la pagination
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return; // Éviter les appels inutiles
    console.log('Page changed from', page, 'to', newPage);
    setPage(newPage);
  }, [page]);

  // Rafraîchissement optimisé de la galerie
  const refreshGallery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    setPage(1);
    
    const noFilters = !searchQuery && !tagFilter && activeTab === 'all' && !selectedProject;
    const canUseRandom = noFilters && (userRole === 'admin' || selectedClient !== null);
    
    setShouldFetchRandom(canUseRandom);
    
    refetch();
  }, [queryClient, refetch, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, userRole]);

  return {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    selectedProject,
    currentPage: page,
    totalCount,
    handlePageChange,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid,
    userRole,
    userClientId,
    shouldFetchRandom
  };
};
