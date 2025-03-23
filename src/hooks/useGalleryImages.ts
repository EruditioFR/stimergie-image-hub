
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchGalleryImages, GALLERY_CACHE_TIME, generateCacheKey } from '@/services/galleryService';
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
  
  const { userRole, user } = useAuth();
  const [userClientId, setUserClientId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserClientId = async () => {
      if (!user) return;
      
      const cachedClientId = sessionStorage.getItem(`userClientId-${user.id}`);
      if (cachedClientId) {
        setUserClientId(cachedClientId);
        console.log('Using cached user client ID:', cachedClientId);
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
    setAllImages([]);
    
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
  
  const handleProjectChange = useCallback((projectId: string | null) => {
    if (previousRequestRef.current) {
      queryClient.cancelQueries({ queryKey: previousRequestRef.current.split(',') });
    }
    
    baseHandleProjectChange(projectId);
    
    setShouldFetchRandom(false);
    setPage(1);
    setAllImages([]);
    
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

  useEffect(() => {
    setPage(1);
    setAllImages([]);
    
    // Modified to ensure random fetching on initial load when no filters are applied
    const noFilters = !searchQuery && !tagFilter && activeTab === 'all' && !selectedProject;
    const canUseRandom = noFilters && (userRole === 'admin' || selectedClient !== null);
    
    console.log('Setting shouldFetchRandom to:', canUseRandom);
    setShouldFetchRandom(canUseRandom);
    
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus, selectedClient, selectedProject, userRole]);

  useEffect(() => {
    if (['admin_client', 'user'].includes(userRole) && userClientId && selectedClient !== userClientId) {
      console.log('Setting client filter to non-admin user client ID:', userClientId);
      baseHandleClientChange(userClientId);
    }
  }, [userRole, userClientId, baseHandleClientChange, selectedClient]);

  const fetchTotalCount = useCallback(async () => {
    const cacheKey = `imageCount-${searchQuery}-${tagFilter}-${activeTab}-${selectedClient}-${selectedProject}-${userRole}-${userClientId}`;
    const cachedCount = sessionStorage.getItem(cacheKey);
    
    if (cachedCount) {
      console.log('Using cached image count:', cachedCount);
      return parseInt(cachedCount, 10);
    }
    
    try {
      let query = supabase
        .from('images')
        .select('id', { count: 'exact', head: true });
      
      if (['admin_client', 'user'].includes(userRole) && userClientId) {
        let clientIdToUse = userClientId;
        
        const projectCacheKey = `projectIds-${clientIdToUse}`;
        const cachedProjectIds = sessionStorage.getItem(projectCacheKey);
        
        if (cachedProjectIds) {
          const projetIds = JSON.parse(cachedProjectIds);
          query = query.in('id_projet', projetIds);
        } else {
          const { data: projetData, error: projetError } = await supabase
            .from('projets')
            .select('id')
            .eq('id_client', clientIdToUse);
          
          if (projetError) {
            console.error('Error fetching projets for client:', projetError);
            return 0;
          }
          
          if (!projetData || projetData.length === 0) {
            return 0;
          }
          
          const projetIds = projetData.map(projet => projet.id);
          
          sessionStorage.setItem(projectCacheKey, JSON.stringify(projetIds));
          
          query = query.in('id_projet', projetIds);
        }
      } else if (selectedClient) {
        const projectCacheKey = `projectIds-${selectedClient}`;
        const cachedProjectIds = sessionStorage.getItem(projectCacheKey);
        
        if (cachedProjectIds) {
          const projetIds = JSON.parse(cachedProjectIds);
          query = query.in('id_projet', projetIds);
        } else {
          const { data: projetData, error: projetError } = await supabase
            .from('projets')
            .select('id')
            .eq('id_client', selectedClient);
          
          if (projetError) {
            console.error('Error fetching projets for client:', projetError);
            return 0;
          }
          
          if (!projetData || projetData.length === 0) {
            return 0;
          }
          
          const projetIds = projetData.map(projet => projet.id);
          
          sessionStorage.setItem(projectCacheKey, JSON.stringify(projetIds));
          
          query = query.in('id_projet', projetIds);
        }
      }
      
      if (selectedProject) {
        query = query.eq('id_projet', selectedProject);
      }
      
      if (searchQuery && searchQuery.trim() !== '') {
        query = query.or(`title.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`);
      }

      if (tagFilter && tagFilter.toLowerCase() !== 'toutes') {
        query = query.ilike('tags', `%${tagFilter.toLowerCase()}%`);
      }
      
      if (activeTab.toLowerCase() !== 'all') {
        query = query.ilike('tags', `%${activeTab.toLowerCase()}%`);
      }
      
      const { count, error } = await query;
      
      if (error) {
        console.error('Error fetching image count:', error);
        return 0;
      }
      
      if (count !== null) {
        sessionStorage.setItem(cacheKey, count.toString());
      }
      
      return count || 0;
    } catch (error) {
      console.error('Error count:', error);
      return 0;
    }
  }, [searchQuery, tagFilter, activeTab, selectedClient, selectedProject, userRole, userClientId]);

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

  useEffect(() => {
    const getTotalCount = async () => {
      const count = await fetchTotalCount();
      setTotalCount(count);
    };
    
    getTotalCount();
  }, [fetchTotalCount, searchQuery, tagFilter, activeTab, selectedClient, selectedProject]);

  useEffect(() => {
    console.log('New images loaded:', newImages.length);
    if (newImages.length > 0) {
      setAllImages(newImages);
      
      if (page < Math.ceil(totalCount / 50) && !shouldFetchRandom) {
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
    } else {
      setAllImages([]);
    }
  }, [newImages, page, queryClient, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, totalCount, shouldFetchRandom, userRole, userClientId, generateCacheKey]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const refreshGallery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    setPage(1);
    setAllImages([]);
    
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
