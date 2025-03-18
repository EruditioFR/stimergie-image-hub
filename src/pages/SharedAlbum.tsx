
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Ban } from 'lucide-react';

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
  created_by_name?: string;
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
  
  // Format dates for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'd MMMM yyyy', { locale: fr });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };
  
  // Format images for display in the MasonryGrid
  const formatImagesForGrid = () => {
    if (!album || !album.images) return [];
    
    return album.images.map(image => ({
      id: image.id.toString(),
      src: image.url_miniature || image.url, // Prioritize url_miniature, fallback to url
      alt: image.title,
      title: image.title,
      author: 'User',
      orientation: image.orientation || undefined,
      disableShare: true, // Add this property to disable share functionality
      disableDownload: true // Add this property to disable download functionality
    }));
  };
  
  const formattedImages = album ? formatImagesForGrid() : [];
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-grow">
        <div className="bg-muted/30 border-b border-border">
          <div className="max-w-7xl mx-auto px-6 py-16">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-2/3 mb-4" />
                <Skeleton className="h-5 w-1/2" />
              </>
            ) : album ? (
              <>
                <div className="flex flex-col items-center mb-8">
                  <img 
                    src="/lovable-uploads/9ce78881-8c65-4716-ab7f-128bb420c8e9.png" 
                    alt="Stimergie Logo" 
                    width="200"
                    className="mb-6"
                  />
                </div>
                <div className="mb-6 text-sm text-muted-foreground">
                  <p>
                    Ceci est un album photo partagé par {album.created_by_name || 'un utilisateur'}. 
                    Vous bénéficiez d'un accès du {formatDate(album.access_from)} au {formatDate(album.access_until)}.
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-amber-600">
                    <Ban className="h-4 w-4" /> Le téléchargement et le partage sont désactivés pour cet album.
                  </p>
                </div>
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
    </div>
  );
}

export default SharedAlbum;
