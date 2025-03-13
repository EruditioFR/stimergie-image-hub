
import React from 'react';
import { ImageCard } from '@/components/ImageCard';

interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  tags?: string[];
  orientation?: string;
}

interface MasonryGridProps {
  images: Image[];
  isLoading?: boolean;
  onLoadMore?: () => void;
}

export function MasonryGrid({ images, isLoading = false, onLoadMore }: MasonryGridProps) {
  // Function to split images into columns for masonry layout
  const getColumnImages = (columnIndex: number, columnCount: number) => {
    return images.filter((_, index) => index % columnCount === columnIndex);
  };

  // Check if we should load more images based on scroll position
  const handleScroll = () => {
    if (!onLoadMore) return;
    
    const scrollHeight = document.documentElement.scrollHeight;
    const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    const clientHeight = document.documentElement.clientHeight;
    
    // Load more when user scrolls to bottom (with a 200px threshold)
    if (scrollHeight - scrollTop - clientHeight < 200 && !isLoading) {
      onLoadMore();
    }
  };

  // Add scroll event listener
  React.useEffect(() => {
    if (onLoadMore) {
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, [onLoadMore, isLoading]);

  if (isLoading && images.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="h-64 rounded-xl bg-muted"></div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {/* First column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {getColumnImages(0, 3).map((image) => (
            <div 
              key={image.id}
              className="opacity-100" 
            >
              <ImageCard 
                {...image} 
                className="w-full"
                orientation={image.orientation}
              />
            </div>
          ))}
        </div>
        
        {/* Second column */}
        <div className="flex flex-col gap-6 md:gap-8">
          {getColumnImages(1, 3).map((image) => (
            <div 
              key={image.id} 
              className="opacity-100" 
            >
              <ImageCard 
                {...image} 
                className="w-full"
                orientation={image.orientation}
              />
            </div>
          ))}
        </div>
        
        {/* Third column */}
        <div className="hidden lg:flex flex-col gap-6 md:gap-8">
          {getColumnImages(2, 3).map((image) => (
            <div 
              key={image.id} 
              className="opacity-100" 
            >
              <ImageCard 
                {...image} 
                className="w-full"
                orientation={image.orientation}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Loading indicator for infinite scroll */}
      {isLoading && images.length > 0 && (
        <div className="flex justify-center mt-8">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </>
  );
}
