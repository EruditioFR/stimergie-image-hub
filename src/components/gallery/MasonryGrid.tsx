
import { ImageCard } from '@/components/ImageCard';

interface Image {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  tags?: string[];
}

interface MasonryGridProps {
  images: Image[];
  isLoading?: boolean;
}

export function MasonryGrid({ images, isLoading = false }: MasonryGridProps) {
  // Function to split images into columns for masonry layout
  const getColumnImages = (columnIndex: number, columnCount: number) => {
    return images.filter((_, index) => index % columnCount === columnIndex);
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 animate-pulse">
        {[1, 2, 3, 4, 5, 6].map((_, index) => (
          <div key={index} className="h-64 rounded-xl bg-muted"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {/* First column */}
      <div className="flex flex-col gap-6 md:gap-8">
        {getColumnImages(0, 3).map((image, index) => (
          <div 
            key={image.id}
            className="animate-fade-up opacity-0" 
            style={{ 
              animationDelay: `${0.05 * index}s`, 
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
              animationDelay: `${0.05 * (index + getColumnImages(0, 3).length)}s`, 
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
              animationDelay: `${0.05 * (index + getColumnImages(0, 3).length + getColumnImages(1, 3).length)}s`, 
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
  );
}
