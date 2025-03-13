
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Image } from '@/pages/Images';
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";

const IMAGES_PER_PAGE = 15;

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
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

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

  // Fetch images from Supabase
  const { data: newImages = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['gallery-images', searchQuery, tagFilter, activeTab, selectedClient, page],
    queryFn: async () => {
      console.log('Fetching images with:', { searchQuery, tagFilter, activeTab, selectedClient, page });
      
      let query = supabase
        .from('images')
        .select(`
          *,
          projets:id_projet (
            id_client
          )
        `)
        .order('created_at', { ascending: false });
      
      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (tagFilter && tagFilter.toLowerCase() !== 'toutes') {
        query = query.ilike('tags', `%${tagFilter.toLowerCase()}%`);
      }
      
      if (activeTab.toLowerCase() !== 'all') {
        query = query.ilike('tags', `%${activeTab.toLowerCase()}%`);
      }

      if (selectedClient && isAdmin) {
        query = query.eq('projets.id_client', selectedClient);
      }
      
      // Apply pagination
      query = query.range((page - 1) * IMAGES_PER_PAGE, page * IMAGES_PER_PAGE - 1);

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching images:', error);
        toast.error("Erreur lors du chargement des images");
        return [];
      }

      console.log(`Fetched ${data.length} images`);

      // Convertir les tags de string à string[] en parsant la valeur
      return data.map(img => ({
        ...img,
        tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
      })) as Image[];
    },
    enabled: true,
    staleTime: 0, // Ne pas mettre en cache les données
    refetchOnWindowFocus: true, // Refetch quand la fenêtre reprend le focus
    refetchOnMount: true, // Refetch quand le composant est monté
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

  // Fetch all unique tags for filtering
  useEffect(() => {
    const fetchAllTags = async () => {
      try {
        const { data, error } = await supabase
          .from('images')
          .select('tags');
        
        if (error) {
          console.error('Error fetching tags:', error);
          return;
        }
        
        // Extract all tags from all images
        const tagsSet = new Set<string>();
        data.forEach(item => {
          const tags = parseTagsString(item.tags);
          if (tags && Array.isArray(tags)) {
            tags.forEach(tag => tagsSet.add(tag.toLowerCase()));
          }
        });
        
        // Convert to array and sort
        const sortedTags = Array.from(tagsSet).sort();
        setAllTags(sortedTags);
        
      } catch (error) {
        console.error('Error processing tags:', error);
      }
    };
    
    fetchAllTags();
  }, []);

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
    setPage(1);
    setAllImages([]);
    setHasActiveFilters(false);
    
    // Clear URL parameters
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.delete('tag');
    window.history.replaceState(null, '', `?${newSearchParams.toString()}`);
    
    // Force a refetch
    setTimeout(() => {
      refetch();
    }, 0);
  }, [refetch, searchParams]);

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
    allTags,
    loadMoreImages,
    handleTabChange,
    handleClientChange,
    handleResetFilters,
    formatImagesForGrid
  };
};
