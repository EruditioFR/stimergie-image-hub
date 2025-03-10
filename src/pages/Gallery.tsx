
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { Button } from '@/components/ui/button';
import { useImages } from '@/context/ImageContext';
import { GalleryHeader } from '@/components/gallery/GalleryHeader';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { EmptyResults } from '@/components/gallery/EmptyResults';

// Mock categories for filters
const categories = ['Toutes', 'Nature', 'Technologie', 'Architecture', 'Personnes', 'Animaux', 'Voyage'];

const Gallery = () => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const { images, searchImages, getImagesByTag } = useImages();
  
  const [activeTab, setActiveTab] = useState('all');
  const [filteredImages, setFilteredImages] = useState(images);
  const [isLoading, setIsLoading] = useState(false);
  
  // Apply filters based on URL parameters
  useEffect(() => {
    setIsLoading(true);
    
    let result = images;
    
    if (searchQuery) {
      result = searchImages(searchQuery);
    } else if (tagFilter) {
      result = getImagesByTag(tagFilter);
      // Find and set the active tab based on the tag
      const tabIndex = categories.findIndex(cat => 
        cat.toLowerCase() === tagFilter.toLowerCase()
      );
      
      if (tabIndex > 0) {
        setActiveTab(categories[tabIndex].toLowerCase());
      }
    }
    
    // Simulate loading delay
    setTimeout(() => {
      setFilteredImages(result);
      setIsLoading(false);
    }, 500);
    
    // Scroll to top
    window.scrollTo(0, 0);
  }, [searchQuery, tagFilter, images, searchImages, getImagesByTag]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === 'all') {
      setFilteredImages(images);
    } else {
      setFilteredImages(getImagesByTag(value));
    }
  };
  
  const loadMore = () => {
    setIsLoading(true);
    // Simulate loading more images
    setTimeout(() => {
      // In a real app, you'd fetch more images here
      setIsLoading(false);
    }, 1000);
  };
  
  // Page title based on filters
  const getPageTitle = () => {
    if (searchQuery) {
      return `Résultats pour "${searchQuery}"`;
    } else if (tagFilter) {
      return `Images de ${tagFilter}`;
    }
    return 'Toutes les images';
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        <GalleryHeader 
          title={getPageTitle()}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          categories={categories}
        />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoading ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : filteredImages.length > 0 ? (
            <>
              <MasonryGrid images={filteredImages} />
              
              {/* Load More Button */}
              <div className="mt-16 text-center">
                <Button 
                  onClick={loadMore} 
                  disabled={isLoading}
                  variant="outline"
                  className="px-8"
                >
                  {isLoading ? 'Chargement...' : 'Afficher plus'}
                </Button>
              </div>
            </>
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
