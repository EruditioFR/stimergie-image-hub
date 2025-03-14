
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Image } from '@/pages/Images';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from "sonner";

const IMAGES_PER_PAGE = 15;
const CACHE_TIME = 5 * 60 * 1000; // 5 minutes en millisecondes

// Fonction utilitaire pour parser les tags depuis une string
const parseTagsString = (tagsString: string | null): string[] | null => {
  if (!tagsString) return null;
  try {
    // Si c'est déjà un JSON (format "[tag1, tag2]"), on le parse
    if (tagsString.startsWith('[')) {
      return JSON.parse(tagsString);
    }
    // Sinon, on le split par virgule (si c'est un format "tag1,tag2")
    return tagsString.split(',').map(tag => tag.trim());
  } catch (e) {
    console.error('Error parsing tags:', e);
    return [tagsString]; // Fallback à un tableau avec la string originale
  }
};

export const useGalleryImages = (isAdmin: boolean) => {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  // Créer une clé de cache unique basée sur les filtres actuels
  const cacheKey = useCallback(() => {
    return ['gallery-images', searchQuery, tagFilter, activeTab, selectedClient, page];
  }, [searchQuery, tagFilter, activeTab, selectedClient, page]);

  // Précharger la page suivante dès que la page actuelle est chargée
  useEffect(() => {
    if (page > 0) {
      const nextPageKey = ['gallery-images', searchQuery, tagFilter, activeTab, selectedClient, page + 1];
      queryClient.prefetchQuery({
        queryKey: nextPageKey,
        queryFn: () => fetchGalleryImages(searchQuery, tagFilter, activeTab, selectedClient, page + 1),
        staleTime: CACHE_TIME,
      });
    }
  }, [queryClient, page, searchQuery, tagFilter, activeTab, selectedClient]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setAllImages([]);
    
    // Update filter status
    setHasActiveFilters(
      searchQuery !== '' || 
      tagFilter !== '' || 
      activeTab.toLowerCase() !== 'all' ||
      selectedClient !== null
    );
  }, [searchQuery, tagFilter, activeTab, selectedClient]);

  // Fonction de récupération des images extraite pour être réutilisable
  const fetchGalleryImages = async (
    search: string, 
    tag: string, 
    tab: string, 
    client: string | null, 
    pageNum: number
  ): Promise<Image[]> => {
    console.log('Fetching images with:', { search, tag, tab, client, pageNum });
    
    let query = supabase
      .from('images')
      .select(`
        *,
        projets:id_projet (
          id_client
        )
      `);
    
    if (search && search.trim() !== '') {
      // Add OR condition for title and tags for better search results
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    if (tag && tag.toLowerCase() !== 'toutes') {
      query = query.ilike('tags', `%${tag.toLowerCase()}%`);
    }
    
    if (tab.toLowerCase() !== 'all') {
      query = query.ilike('tags', `%${tab.toLowerCase()}%`);
    }

    if (client) {
      // Filter by projets.id_client through the joined table relationship
      query = query.eq('projets.id_client', client);
    }
    
    // Apply ordering
    query = query.order('created_at', { ascending: false });
    
    // Apply pagination
    query = query.range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);

    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching images:', error);
      toast.error("Erreur lors du chargement des images");
      return [];
    }

    console.log(`Fetched ${data.length} images for page ${pageNum}`);

    // Convertir les tags de string à string[] en parsant la valeur
    return data.map(img => ({
      ...img,
      tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
    })) as Image[];
  };

  // Fetch images from Supabase with caching
  const { data: newImages = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: cacheKey(),
    queryFn: () => fetchGalleryImages(searchQuery, tagFilter, activeTab, selectedClient, page),
    staleTime: CACHE_TIME,
    gcTime: CACHE_TIME * 2, // Conserver dans le cache pendant deux fois plus longtemps
    refetchOnWindowFocus: false, // Ne pas refetch quand la fenêtre reprend le focus, sauf manuel
  });

  // Add newly loaded images to our collection
  useEffect(() => {
    console.log('New images loaded:', newImages.length);
    if (newImages.length > 0) {
      if (page === 1) {
        setAllImages(newImages);
      } else {
        // Ensure we don't add duplicates
        const newImageIds = new Set(newImages.map(img => img.id));
        const filteredExistingImages = allImages.filter(img => !newImageIds.has(img.id));
        setAllImages([...filteredExistingImages, ...newImages]);
      }
    } else if (page === 1) {
      // Si nous sommes à la première page et qu'il n'y a pas d'images, vider la collection
      setAllImages([]);
    }
  }, [newImages, page]);

  // Handle loading more images
  const loadMoreImages = useCallback(() => {
    if (!isLoading && !isFetching && newImages.length === IMAGES_PER_PAGE) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, isFetching, newImages.length]);

  const handleTabChange = useCallback((value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
  }, []);

  const handleClientChange = useCallback((clientId: string | null) => {
    console.log('Client changed to:', clientId);
    setSelectedClient(clientId);
  }, []);

  const handleResetFilters = useCallback(() => {
    console.log('Resetting filters');
    setActiveTab('all');
    setSelectedClient(null);
    
    // Clear URL search params
    navigate('/gallery', { replace: true });
    
    // Reset state 
    setPage(1);
    setAllImages([]);
    setHasActiveFilters(false);
    
    // Force a refetch with cleared filters
    setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      refetch();
    }, 0);
  }, [navigate, queryClient, refetch]);

  // Invalidate cache and force refresh
  const refreshGallery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    setPage(1);
    setAllImages([]);
    refetch();
  }, [queryClient, refetch]);

  // Format images for MasonryGrid
  const formatImagesForGrid = useCallback((images: Image[] = []) => {
    return images.map(image => ({
      id: image.id.toString(),
      src: image.url_miniature || image.url, // Utiliser la miniature si disponible
      alt: image.title,
      title: image.title,
      author: 'User',
      tags: image.tags,
      orientation: image.orientation
    }));
  }, []);

  return {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    loadMoreImages,
    handleTabChange,
    handleClientChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid
  };
};
