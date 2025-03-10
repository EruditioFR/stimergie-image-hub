
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { ImageCard } from '@/components/ImageCard';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { useImages } from '@/context/ImageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
        {/* Gallery Header */}
        <div className="bg-muted/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-16">
            <h1 className="text-3xl font-bold mb-6">{getPageTitle()}</h1>
            
            <SearchBar className="mb-8" />
            
            {/* Category Tabs */}
            <Tabs 
              defaultValue={activeTab} 
              value={activeTab}
              onValueChange={handleTabChange}
              className="w-full"
            >
              <TabsList className="w-full max-w-full overflow-x-auto flex-wrap sm:flex-nowrap no-scrollbar py-1">
                <TabsTrigger value="all" className="flex-shrink-0">
                  Toutes
                </TabsTrigger>
                {categories.slice(1).map(category => (
                  <TabsTrigger 
                    key={category} 
                    value={category.toLowerCase()}
                    className="flex-shrink-0"
                  >
                    {category}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Gallery Content */}
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
              {[1, 2, 3, 4, 5, 6].map((_, index) => (
                <div key={index} className="h-64 rounded-xl bg-muted"></div>
              ))}
            </div>
          ) : filteredImages.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredImages.map((image, index) => (
                  <div 
                    key={image.id} 
                    className="animate-fade-up opacity-0" 
                    style={{ 
                      animationDelay: `${0.05 * index}s`, 
                      animationFillMode: 'forwards' 
                    }}
                  >
                    <ImageCard {...image} />
                  </div>
                ))}
              </div>
              
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
            <div className="text-center py-20">
              <h3 className="text-xl font-medium mb-2">Aucun résultat trouvé</h3>
              <p className="text-muted-foreground mb-8">
                Essayez d'autres termes de recherche ou explorez nos catégories
              </p>
              <Button 
                variant="outline"
                onClick={() => handleTabChange('all')}
              >
                Voir toutes les images
              </Button>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Gallery;
