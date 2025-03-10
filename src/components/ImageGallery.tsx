
import { useState, useEffect } from 'react';
import { ImageCard } from '@/components/ImageCard';
import { Button } from '@/components/ui/button';

// Mock data for now
const mockImages = [
  {
    id: '1',
    src: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80',
    alt: 'A woman sitting on a bed using a laptop',
    title: 'Travail à distance',
    author: 'Anna Johnson'
  },
  {
    id: '2',
    src: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
    alt: 'Turned on gray laptop computer',
    title: 'Technologie moderne',
    author: 'Michael Chen'
  },
  {
    id: '3',
    src: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    alt: 'Macro photography of black circuit board',
    title: 'Circuit imprimé',
    author: 'Sarah Williams'
  },
  {
    id: '4',
    src: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
    alt: 'Monitor showing Java programming',
    title: 'Code informatique',
    author: 'Alex Developer'
  },
  {
    id: '5',
    src: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80',
    alt: 'Person using MacBook Pro',
    title: 'Espace de travail',
    author: 'Jessica Miller'
  },
  {
    id: '6',
    src: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    alt: 'Woman using black laptop computer',
    title: 'Travail créatif',
    author: 'Thomas Creative'
  }
];

interface ImageGalleryProps {
  title?: string;
  subtitle?: string;
  className?: string;
  limit?: number;
}

export function ImageGallery({ title, subtitle, className, limit }: ImageGalleryProps) {
  const [images, setImages] = useState(mockImages);
  const [isLoading, setIsLoading] = useState(false);

  const displayImages = limit ? images.slice(0, limit) : images;

  const loadMore = () => {
    setIsLoading(true);
    // Simulate loading more images
    setTimeout(() => {
      // In a real app, you'd fetch more images here
      setImages([...images, ...mockImages]);
      setIsLoading(false);
    }, 1000);
  };

  // This would be replaced with a real data fetching method
  useEffect(() => {
    // Fetch images logic would go here
  }, []);

  // Function to split images into columns for masonry layout
  const getColumnImages = (columnIndex: number, columnCount: number) => {
    return displayImages.filter((_, index) => index % columnCount === columnIndex);
  };

  return (
    <div className={className}>
      {/* Gallery header */}
      {(title || subtitle) && (
        <div className="mb-10 text-center">
          {title && <h2 className="text-3xl font-bold mb-3">{title}</h2>}
          {subtitle && <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
        </div>
      )}

      {/* Masonry layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* First column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {getColumnImages(0, 3).map((image, index) => (
            <div 
              key={image.id}
              className="animate-fade-up opacity-0" 
              style={{ 
                animationDelay: `${0.1 * index}s`, 
                animationFillMode: 'forwards' 
              }}
            >
              <ImageCard 
                {...image} 
                className="h-full"
              />
            </div>
          ))}
        </div>
        
        {/* Second column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {getColumnImages(1, 3).map((image, index) => (
            <div 
              key={image.id} 
              className="animate-fade-up opacity-0" 
              style={{ 
                animationDelay: `${0.1 * (index + getColumnImages(0, 3).length)}s`, 
                animationFillMode: 'forwards' 
              }}
            >
              <ImageCard 
                {...image} 
                className="h-full"
              />
            </div>
          ))}
        </div>
        
        {/* Third column */}
        <div className="hidden lg:flex flex-col gap-6 md:gap-8">
          {getColumnImages(2, 3).map((image, index) => (
            <div 
              key={image.id} 
              className="animate-fade-up opacity-0" 
              style={{ 
                animationDelay: `${0.1 * (index + getColumnImages(0, 3).length + getColumnImages(1, 3).length)}s`, 
                animationFillMode: 'forwards' 
              }}
            >
              <ImageCard 
                {...image} 
                className="h-full"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Load more button */}
      {!limit && (
        <div className="mt-12 text-center">
          <Button 
            onClick={loadMore} 
            disabled={isLoading}
            variant="outline"
            className="px-8"
          >
            {isLoading ? 'Chargement...' : 'Afficher plus'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default ImageGallery;
