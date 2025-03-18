
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";
import { fetchGalleryImages, GALLERY_CACHE_TIME, generateCacheKey } from '@/services/galleryService';
import { formatImagesForGrid } from '@/utils/imageUtils';
import { useGalleryFilters } from './useGalleryFilters';
import { Image } from '@/pages/Images';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useGalleryImages = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const pageParam = searchParams.get('page');
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const previousRequestRef = useRef<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  
  const { userRole, user } = useAuth();
  const [userClientId, setUserClientId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchUserClientId = async () => {
      if (!user || userRole !== 'admin_client') return;
      
      try {
        const { data, error } = await supabase.rpc('get_user_client_id', {
          user_id: user.id
        });
        
        if (error) {
          console.error('Error fetching user client ID:', error);
          return;
        }
        
        setUserClientId(data);
        console.log('User client ID fetched:', data);
      } catch (error) {
        console.error('Error fetching user client ID:', error);
      }
    };
    
    fetchUserClientId();
  }, [user, userRole]);

  const {
    activeTab,
    selectedClient,
    hasActiveFilters,
    handleTabChange,
    handleClientChange: baseHandleClientChange,
    handleResetFilters,
    updateFilterStatus
  } = useGalleryFilters();

  const cacheKey = useCallback(() => {
    return generateCacheKey(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient, 
      page, 
      isAdmin, 
      isInitialLoad,
      userRole,
      userClientId
    );
  }, [searchQuery, tagFilter, activeTab, selectedClient, page, isAdmin, isInitialLoad, userRole, userClientId]);

  const handleClientChange = useCallback((clientId: string | null) => {
    if (userRole === 'admin_client' && userClientId) {
      console.log('Admin client users cannot change their client filter');
      return;
    }
    
    if (previousRequestRef.current) {
      queryClient.cancelQueries({ queryKey: previousRequestRef.current.split(',') });
    }
    
    baseHandleClientChange(clientId);
    
    setPage(1);
    setAllImages([]);
    
    setIsInitialLoad(false);
    
    previousRequestRef.current = generateCacheKey(
      searchQuery, 
      tagFilter, 
      activeTab, 
      clientId, 
      1, 
      isAdmin, 
      false,
      userRole,
      userClientId
    ).join(',');
  }, [baseHandleClientChange, searchQuery, tagFilter, activeTab, queryClient, isAdmin, userRole, userClientId]);

  // Disable prefetching to save bandwidth
  // We only fetch what we need when we need it

  useEffect(() => {
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(false);
    
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus]);

  useEffect(() => {
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(false);
  }, [selectedClient]);

  useEffect(() => {
    if (userClientId) {
      setPage(1);
      setAllImages([]);
      setIsInitialLoad(true);
    }
  }, [userClientId]);

  useEffect(() => {
    if (userRole === 'admin_client' && userClientId && selectedClient !== userClientId) {
      console.log('Setting client filter to admin_client user client ID:', userClientId);
      baseHandleClientChange(userClientId);
    }
  }, [userRole, userClientId, baseHandleClientChange, selectedClient]);

  const fetchTotalCount = useCallback(async () => {
    try {
      let query = supabase
        .from('images')
        .select('id', { count: 'exact', head: true });
      
      if (selectedClient) {
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
        
        query = query.in('id_projet', projetIds);
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
      
      return count || 0;
    } catch (error) {
      console.error('Error count:', error);
      return 0;
    }
  }, [searchQuery, tagFilter, activeTab, selectedClient]);

  const { data: newImages = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: cacheKey(),
    queryFn: () => fetchGalleryImages(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient, 
      page, 
      isAdmin, 
      isInitialLoad,
      userRole,
      userClientId
    ),
    staleTime: 0, // Always refetch - no caching
    gcTime: 0,    // No garbage collection time - don't keep in cache
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    enabled: true
  });

  useEffect(() => {
    const getTotalCount = async () => {
      const count = await fetchTotalCount();
      setTotalCount(count);
    };
    
    getTotalCount();
  }, [fetchTotalCount, searchQuery, tagFilter, activeTab, selectedClient]);

  useEffect(() => {
    console.log('New images loaded:', newImages.length);
    if (newImages.length > 0) {
      setAllImages(newImages);
    } else {
      setAllImages([]);
    }
    
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [newImages, page, isInitialLoad]);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set('page', newPage.toString());
    window.history.pushState(null, '', `?${newSearchParams.toString()}`);
  }, []);

  const refreshGallery = useCallback(() => {
    // Force clear the cache
    queryClient.removeQueries({ queryKey: ['gallery-images'] });
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(true);
    refetch();
  }, [queryClient, refetch]);

  return {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    currentPage: page,
    totalCount,
    handlePageChange,
    handleTabChange,
    handleClientChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid,
    userRole,
    userClientId
  };
};
