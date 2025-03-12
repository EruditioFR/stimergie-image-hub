
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { Button } from '@/components/ui/button';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { EmptyResults } from '@/components/gallery/EmptyResults';
import { supabase } from '@/integrations/supabase/client';
import { Image } from '@/pages/Images';
import { useQuery } from '@tanstack/react-query';

// Mock categories for filters
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const [activeTab, setActiveTab] = useState('all');

  // Fetch images from Supabase
  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images', searchQuery, tagFilter],
    queryFn: async () => {
      let query = supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (tagFilter && tagFilter.toLowerCase() !== 'toutes') {
        query = query.contains('tags', [tagFilter.toLowerCase()]);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching images:', error);
        return [];
      }

      return data as Image[];
    }
  });

  // Filter images based on active tab
  const getFilteredImages = () => {
    if (activeTab === 'all') return images;
    return images.filter(image => 
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
      src: image.url,
      alt: image.title,
      title: image.title,
      author: 'User',
      tags: image.tags
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
          {isLoading ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : getFilteredImages().length > 0 ? (
            <MasonryGrid 
              images={formatImagesForGrid(getFilteredImages())} 
              isLoading={false}
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
