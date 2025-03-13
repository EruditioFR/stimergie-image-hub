
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';

// Define types for the album data
interface AlbumImage {
  id: number;
  title: string;
  description: string | null;
  url: string;
  width: number | null;
  height: number | null;
  orientation: string | null;
  url_miniature?: string | null;
}

interface Album {
  id: string;
  name: string;
  description: string | null;
  access_from: string;
  access_until: string;
  images: AlbumImage[];
}

export function SharedAlbum() {
  const { shareKey } = useParams<{ shareKey: string }>();
  const navigate = useNavigate();
  
  const { data: album, isLoading, error } = useQuery<Album>({
    queryKey: ['shared-album', shareKey],
    queryFn: async () => {
      if (!shareKey) throw new Error('No share key provided');
      
      const { data, error } = await supabase
        .rpc('get_album_by_share_key', { share_key_param: shareKey });
      
      if (error) {
        console.error('Error fetching album:', error);
        throw new Error(error.message);
      }
      
      if (!data || data.length === 0) {
        throw new Error('Album not found or expired');
      }
      
      // Cast the JSON images to the correct type
      const albumData = data[0] as unknown as Album;
      
      // Parse the images JSON string into an array of objects
      if (typeof albumData.images === 'string') {
        albumData.images = JSON.parse(albumData.images);
      }
      
      return albumData;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });
  
  useEffect(() => {
    if (error) {
      toast.error('Cet album n\'existe pas ou a expiré');
      navigate('/gallery');
    }
  }, [error, navigate]);
  
  // Format images for display in the MasonryGrid
  const formatImagesForGrid = () => {
    if (!album || !album.images) return [];
    
    return album.images.map(image => ({
      id: image.id.toString(),
      src: image.url_miniature || image.url,
      alt: image.title,
      title: image.title,
      author: 'User',
      orientation: image.orientation || undefined
    }));
  };
  
  const formattedImages = album ? formatImagesForGrid() : [];
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-20">
        <div className="bg-muted/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-16">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-2/3 mb-4" />
                <Skeleton className="h-5 w-1/2" />
              </>
            ) : album ? (
              <>
                <h1 className="text-3xl font-bold mb-4">{album.name}</h1>
                {album.description && (
                  <p className="text-muted-foreground max-w-2xl">{album.description}</p>
                )}
              </>
            ) : null}
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoading ? (
            <MasonryGrid images={[]} isLoading={true} />
          ) : album ? (
            <>
              {formattedImages.length > 0 ? (
                <MasonryGrid images={formattedImages} />
              ) : (
                <div className="text-center py-20">
                  <h3 className="text-xl font-medium mb-2">Cet album ne contient aucune image</h3>
                </div>
              )}
            </>
          ) : null}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

export default SharedAlbum;
