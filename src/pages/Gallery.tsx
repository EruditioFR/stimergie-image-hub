
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { supabase } from '@/integrations/supabase/client';
import { Image } from '@/pages/Images';
import { useQuery } from '@tanstack/react-query';
import { toast } from "sonner";
import { useAuth } from '@/context/AuthContext';

// Mock categories for filters
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const IMAGES_PER_PAGE = 15;

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [allImages, setAllImages] = useState<Image[]>([]);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const { userRole } = useAuth();
  const isAdmin = ['admin', 'admin_client'].includes(userRole);

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

  // Ensure we refetch when component mounts
  useEffect(() => {
    const loadInitialData = async () => {
      console.log('Component mounted, loading initial data');
      await refetch();
    };
    
    loadInitialData();
    
    // Reset state when unmounting (for when we return to the page)
    return () => {
      console.log('Component unmounting, resetting state');
      setPage(1);
      setAllImages([]);
      setActiveTab('all');
      setSelectedClient(null);
      setHasActiveFilters(false);
    };
  }, [refetch]);

  // Handle loading more images
  const loadMoreImages = () => {
    if (!isLoading && !isFetching && newImages.length === IMAGES_PER_PAGE) {
      setPage(prev => prev + 1);
    }
  };

  // Filter images based on active tab
  const getFilteredImages = useCallback(() => {
    return allImages;
  }, [allImages]);

  const handleTabChange = (value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
  };

  const handleClientChange = (clientId: string | null) => {
    console.log('Client changed to:', clientId);
    setSelectedClient(clientId);
  };

  const handleResetFilters = useCallback(() => {
    console.log('Resetting filters');
    setActiveTab('all');
    setSelectedClient(null);
    setPage(1);
    setAllImages([]);
    setHasActiveFilters(false);
    
    // Force a refetch
    setTimeout(() => {
      refetch();
    }, 0);
  }, [refetch]);

  // Format images for MasonryGrid
  const formatImagesForGrid = (images: Image[] = []) => {
    return images.map(image => ({
      id: image.id.toString(),
      src: image.url_miniature || image.url, // Utiliser la miniature si disponible
      alt: image.title,
      title: image.title,
      author: 'User',
      tags: image.tags,
      orientation: image.orientation
    }));
  };

  const displayedImages = getFilteredImages();
  const shouldShowEmptyState = !isLoading && displayedImages.length === 0;

  console.log('Render state:', { 
    hasImages: displayedImages.length > 0, 
    isLoading, 
    hasActiveFilters,
    imagesCount: allImages.length
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        <GalleryHeader 
          title={searchQuery ? `Résultats pour "${searchQuery}"` : 'Galerie d\'images'}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          categories={categories}
          selectedClient={selectedClient}
          onClientChange={handleClientChange}
        />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoading && allImages.length === 0 ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : displayedImages.length > 0 ? (
            <MasonryGrid 
              images={formatImagesForGrid(displayedImages)} 
              isLoading={isLoading || isFetching}
              onLoadMore={loadMoreImages}
            />
          ) : (
            <EmptyResults 
              onReset={handleResetFilters} 
              hasFilters={hasActiveFilters}
            />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;
