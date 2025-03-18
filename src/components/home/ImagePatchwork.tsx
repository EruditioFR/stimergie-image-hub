
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { LazyImage } from '@/components/LazyImage';
import { cn } from '@/lib/utils';

interface Image {
  id: string;
  url: string;
  title: string;
}

export function ImagePatchwork() {
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRandomImages = async () => {
      try {
        setIsLoading(true);
        // Fetch random images from Supabase
        const { data, error } = await supabase
          .from('images')
          .select('id, url, title')
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching images:', error);
          // Fallback to mock images if database query fails
          setImages(getMockImages());
          return;
        }

        if (data && data.length > 0) {
          setImages(data.map(img => ({
            id: img.id.toString(),
            url: img.url,
            title: img.title || 'Image'
          })));
        } else {
          // Use mock images if no images in database
          setImages(getMockImages());
        }
      } catch (error) {
        console.error('Error in image fetch:', error);
        setImages(getMockImages());
      } finally {
        setIsLoading(false);
      }
    };

    fetchRandomImages();
  }, []);

  // Fallback images if database is empty or request fails
  const getMockImages = (): Image[] => {
    return [
      { id: '1', url: 'https://images.unsplash.com/photo-1649972904349-6e44c42644a7?auto=format&fit=crop&w=800&q=80', title: 'Travail à distance' },
      { id: '2', url: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80', title: 'Technologie moderne' },
      { id: '3', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80', title: 'Circuit imprimé' },
      { id: '4', url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80', title: 'Code informatique' },
      { id: '5', url: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=800&q=80', title: 'Espace de travail' },
      { id: '6', url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80', title: 'Travail créatif' },
    ];
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1 h-screen animate-pulse">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="bg-gray-200 h-full w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 h-screen">
      {images.map((image, index) => (
        <div 
          key={image.id} 
          className={cn(
            "overflow-hidden bg-gray-100 relative", 
            // Make some images span multiple cells for visual interest
            index % 7 === 0 ? "row-span-2 col-span-2" : "",
            index % 5 === 0 && index % 7 !== 0 ? "col-span-2" : "",
            index % 11 === 0 ? "row-span-2" : ""
          )}
        >
          <LazyImage 
            src={image.url} 
            alt={image.title}
            className="h-full w-full object-cover"
            objectFit="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
            <h3 className="text-white text-sm md:text-base font-medium">{image.title}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
