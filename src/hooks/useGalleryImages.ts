
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
  
  // Get user information for filtering
  const { userRole, user } = useAuth();
  const [userClientId, setUserClientId] = useState<string | null>(null);
  
  // Fetch the user's client ID if they are an admin_client
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

  // Import filter management
  const {
    activeTab,
    selectedClient,
    hasActiveFilters,
    handleTabChange,
    handleClientChange: baseHandleClientChange,
    handleResetFilters,
    updateFilterStatus
  } = useGalleryFilters();

  // Create a cache key based on current filters
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

  // Override client change handler to reset pagination and cancel any previous requests
  const handleClientChange = useCallback((clientId: string | null) => {
    // Admin_client users can't change their client
    if (userRole === 'admin_client' && userClientId) {
      console.log('Admin client users cannot change their client filter');
      return;
    }
    
    // Cancel previous requests by invalidating the cache
    if (previousRequestRef.current) {
      // We don't want to refetch, just invalidate
      queryClient.cancelQueries({ queryKey: previousRequestRef.current.split(',') });
    }
    
    // Update client filter
    baseHandleClientChange(clientId);
    
    // Reset page to 1 when client changes
    setPage(1);
    setAllImages([]);
    
    // No longer initial load
    setIsInitialLoad(false);
    
    // Set new request reference
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

  // Précharger la page suivante pour une expérience plus fluide
  useEffect(() => {
    if (page > 0) {
      const nextPageKey = generateCacheKey(
        searchQuery, 
        tagFilter, 
        activeTab, 
        selectedClient, 
        page + 1, 
        isAdmin, 
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
          page + 1, 
          isAdmin, 
          false,
          userRole,
          userClientId
        ),
        staleTime: GALLERY_CACHE_TIME,
      });
    }
  }, [queryClient, page, searchQuery, tagFilter, activeTab, selectedClient, isAdmin, userRole, userClientId]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(false);
    
    // Update filter status
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus]);

  // When selectedClient changes, we reset and start fresh
  useEffect(() => {
    setPage(1);
    setAllImages([]);
    setIsInitialLoad(false);
  }, [selectedClient]);

  // When userClientId changes (after it's fetched), we reset and start fresh
  useEffect(() => {
    if (userClientId) {
      setPage(1);
      setAllImages([]);
      setIsInitialLoad(true);
    }
  }, [userClientId]);

  // For admin_client users, automatically set their client ID
  useEffect(() => {
    if (userRole === 'admin_client' && userClientId && selectedClient !== userClientId) {
      console.log('Setting client filter to admin_client user client ID:', userClientId);
      baseHandleClientChange(userClientId);
    }
  }, [userRole, userClientId, baseHandleClientChange, selectedClient]);

  // Récupérer le nombre total d'images pour la pagination
  const fetchTotalCount = useCallback(async () => {
    try {
      // Construire une requête de base
      let query = supabase
        .from('images')
        .select('id', { count: 'exact', head: true });
      
      // Appliquer filtre client si fourni
      if (selectedClient) {
        // Récupérer tous les projets pour ce client d'abord
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
        
        // Extraire IDs de projet
        const projetIds = projetData.map(projet => projet.id);
        
        // Filtrer images par IDs de projet
        query = query.in('id_projet', projetIds);
      }
      
      // Appliquer filtre de recherche
      if (searchQuery && searchQuery.trim() !== '') {
        query = query.or(`title.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`);
      }

      // Appliquer filtre de tag
      if (tagFilter && tagFilter.toLowerCase() !== 'toutes') {
        query = query.ilike('tags', `%${tagFilter.toLowerCase()}%`);
      }
      
      // Appliquer filtre d'onglet
      if (activeTab.toLowerCase() !== 'all') {
        query = query.ilike('tags', `%${activeTab.toLowerCase()}%`);
      }
      
      // Exécuter requête
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

  // Fetch images from Supabase with caching
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
    staleTime: GALLERY_CACHE_TIME,
    gcTime: GALLERY_CACHE_TIME * 2, // Keep in cache twice as long
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    enabled: true, // Always enabled, we'll handle manual invalidation
  });

  // Récupérer le nombre total d'images lors du chargement initial ou du changement de filtres
  useEffect(() => {
    const getTotalCount = async () => {
      const count = await fetchTotalCount();
      setTotalCount(count);
    };
    
    getTotalCount();
  }, [fetchTotalCount, searchQuery, tagFilter, activeTab, selectedClient]);

  // Add newly loaded images to our collection
  useEffect(() => {
    console.log('New images loaded:', newImages.length);
    if (newImages.length > 0) {
      setAllImages(newImages);
    } else {
      setAllImages([]);
    }
    
    // After first load, set initialLoad to false
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }
  }, [newImages, page, isInitialLoad]);

  // Fonction de changement de page pour la pagination
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
    // Mettre à jour l'URL avec le paramètre de page
    const newSearchParams = new URLSearchParams(window.location.search);
    newSearchParams.set('page', newPage.toString());
    window.history.pushState(null, '', `?${newSearchParams.toString()}`);
  }, []);

  // Handle loading more images (pour le scroll infini si besoin)
  const loadMoreImages = useCallback(() => {
    if (!isLoading && !isFetching && newImages.length === 15) { // 15 is the IMAGES_PER_PAGE constant
      setPage(prev => prev + 1);
    }
  }, [isLoading, isFetching, newImages.length]);

  // Invalidate cache and force refresh
  const refreshGallery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
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
    loadMoreImages,
    handleTabChange,
    handleClientChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid,
    userRole,
    userClientId
  };
};
