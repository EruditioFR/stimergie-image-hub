
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { supabase } from '@/integrations/supabase/client';
import { Image } from '@/pages/Images';
import { useQuery } from '@tanstack/react-query';

// Mock categories for filters
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const IMAGES_PER_PAGE = 15;

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [activeTab, setActiveTab] = useState('all');
  const [page, setPage] = useState(1);
  const [allImages, setAllImages] = useState<Image[]>([]);

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

  // Fetch images from Supabase
  const { data: newImages = [], isLoading, isFetching, refetch } = useQuery({
    queryKey: ['gallery-images', searchQuery, tagFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false })
        .range((page - 1) * IMAGES_PER_PAGE, page * IMAGES_PER_PAGE - 1);

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (tagFilter && tagFilter.toLowerCase() !== 'toutes') {
        query = query.ilike('tags', `%${tagFilter.toLowerCase()}%`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching images:', error);
        return [];
      }

      // Convertir les tags de string à string[] en parsant la valeur
      return data.map(img => ({
        ...img,
        tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
      })) as Image[];
    },
    enabled: true,
  });

  // Add newly loaded images to our collection
  useEffect(() => {
    if (newImages.length > 0) {
      if (page === 1) {
        setAllImages(newImages);
      } else {
        // Ensure we don't add duplicates
        const newImageIds = new Set(newImages.map(img => img.id));
        const filteredExistingImages = allImages.filter(img => !newImageIds.has(img.id));
        setAllImages([...filteredExistingImages, ...newImages]);
      }
    }
  }, [newImages, page]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
    setAllImages([]);
  }, [searchQuery, tagFilter, activeTab]);

  // Handle loading more images
  const loadMoreImages = () => {
    if (!isLoading && !isFetching && newImages.length === IMAGES_PER_PAGE) {
      setPage(prev => prev + 1);
    }
  };

  // Filter images based on active tab
  const getFilteredImages = () => {
    if (activeTab === 'all') return allImages;
    return allImages.filter(image => 
      image.tags?.some(tag => 
        tag.toLowerCase() === activeTab.toLowerCase()
      )
    );
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        <GalleryHeader 
          title={searchQuery ? `Résultats pour "${searchQuery}"` : 'Galerie d\'images'}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          categories={categories}
        />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoading && allImages.length === 0 ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : getFilteredImages().length > 0 ? (
            <MasonryGrid 
              images={formatImagesForGrid(getFilteredImages())} 
              isLoading={isLoading || isFetching}
              onLoadMore={loadMoreImages}
            />
          ) : (
            <EmptyResults onReset={() => handleTabChange('all')} />
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;
