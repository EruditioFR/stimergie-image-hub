import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MasonryGrid } from '@/components/gallery/masonry/MasonryGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Download, Share, ArrowLeft } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Image } from '@/utils/image/types';
import { useToast } from '@/hooks/use-toast';
import { Json } from '@/integrations/supabase/types';

interface AlbumImage {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  width?: number | null;
  height?: number | null;
  orientation?: string | null;
  id_projet?: string;
}

interface AlbumData {
  id: string;
  name: string;
  description: string | null;
  access_from: string;
  access_until: string;
  images: AlbumImage[];
}

interface RawAlbumData {
  id: string;
  name: string;
  description: string | null;
  access_from: string;
  access_until: string;
  images: Json;
}

interface RawImageData {
  id: string | number;
  title?: string;
  url?: string;
  description?: string | null;
  width?: number | null;
  height?: number | null;
  orientation?: string | null;
  id_projet?: string;
  [key: string]: any;
}

const SharedAlbum = () => {
  const { albumKey } = useParams<{ albumKey: string }>();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  const [folderNames, setFolderNames] = useState<Record<string, string>>({});
  
  const fetchAlbumData = async (): Promise<AlbumData> => {
    if (!albumKey) throw new Error('No album key provided');
    
    console.log('Fetching album with share key:', albumKey);
    
    const { data, error } = await supabase.rpc('get_album_by_share_key', {
      share_key_param: albumKey
    });
    
    if (error) {
      console.error('Error fetching album:', error);
      throw error;
    }
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('No album found with key:', albumKey);
      throw new Error('Album not found or expired');
    }
    
    console.log('Album data received:', data);
    
    const rawData = data[0] as RawAlbumData;
    
    let processedImages: AlbumImage[] = [];
    if (rawData.images && typeof rawData.images === 'object') {
      const imageArray = Array.isArray(rawData.images) ? rawData.images : [rawData.images];
      
      processedImages = imageArray.map((img: Json) => {
        const imgData = img as unknown as RawImageData;
        
        const id = typeof imgData.id === 'number' 
          ? imgData.id 
          : parseInt(String(imgData.id || '0'), 10) || 0;
        
        return {
          id: id,
          title: String(imgData.title || ''),
          url: String(imgData.url || ''),
          description: imgData.description as string | null,
          width: typeof imgData.width === 'number' ? imgData.width : null,
          height: typeof imgData.height === 'number' ? imgData.height : null,
          orientation: imgData.orientation as string | null,
          id_projet: imgData.id_projet as string | undefined
        };
      });
    } else {
      console.warn('Album images property is not a valid array:', rawData.images);
    }
    
    console.log('Processed images:', processedImages);
    
    return {
      id: rawData.id,
      name: rawData.name,
      description: rawData.description,
      access_from: rawData.access_from,
      access_until: rawData.access_until,
      images: processedImages
    };
  };
  
  const { data: album, isLoading, isError, error } = useQuery({
    queryKey: ['shared-album', albumKey],
    queryFn: fetchAlbumData,
    retry: 1,
    onError: (err) => {
      console.error('Error in album query:', err);
    }
  });

  useEffect(() => {
    if (error) {
      console.error('Album query error:', error);
    }
    
    const fetchFolderNames = async () => {
      if (!album || !album.images || !Array.isArray(album.images) || album.images.length === 0) return;
      
      const projectIds = Array.from(
        new Set(
          album.images
            .filter(img => img.id_projet)
            .map(img => img.id_projet)
        )
      );
      
      if (projectIds.length === 0) return;
      
      try {
        const { data, error } = await supabase
          .from('projets')
          .select('id, nom_dossier')
          .in('id', projectIds as string[]);
          
        if (error) throw error;
        
        const folderMap: Record<string, string> = {};
        data.forEach(project => {
          folderMap[project.id] = project.nom_dossier || '';
        });
        
        setFolderNames(folderMap);
      } catch (err) {
        console.error('Error fetching folder names:', err);
      }
    };
    
    fetchFolderNames();
  }, [album, error]);
  
  const downloadAllImages = async () => {
    if (!album || !album.images || !Array.isArray(album.images) || album.images.length === 0) return;
    
    setIsDownloading(true);
    toast({
      title: "Préparation du téléchargement",
      description: "Nous préparons votre téléchargement...",
    });
    
    try {
      const zip = new JSZip();
      
      const fetchPromises = album.images.map(async (image: AlbumImage, index: number) => {
        try {
          const downloadUrl = image.url;
          
          const response = await fetch(downloadUrl);
          if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
          
          const blob = await response.blob();
          const fileName = `image-${index + 1}.jpg`;
          zip.file(fileName, blob);
          
          return true;
        } catch (err) {
          console.error(`Failed to add image ${index} to zip:`, err);
          return false;
        }
      });
      
      await Promise.all(fetchPromises);
      
      const content = await zip.generateAsync({ type: 'blob' });
      
      const albumName = album.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      saveAs(content, `album-${albumName}.zip`);
      
      toast({
        title: "Téléchargement prêt",
        description: "Votre album a été téléchargé avec succès."
      });
    } catch (err) {
      console.error('Error downloading album:', err);
      toast({
        variant: "destructive",
        title: "Erreur de téléchargement",
        description: "Une erreur est survenue lors du téléchargement de l'album."
      });
    } finally {
      setIsDownloading(false);
    }
  };
  
  const formatImagesForGrid = (): Image[] => {
    if (!album || !album.images || !Array.isArray(album.images)) return [];
    
    return album.images.map((image: AlbumImage) => {
      const display_url = image.url;
      const download_url = image.url;
      
      return {
        id: image.id.toString(),
        src: display_url,
        display_url: display_url,
        download_url: download_url,
        download_url_sd: image.url,
        alt: image.title || 'Image partagée',
        title: image.title || 'Sans titre',
        author: 'Album partagé',
        orientation: image.orientation || 'landscape',
      } as Image;
    });
  };
  
  if (isLoading) {
    return (
      <div className="container max-w-7xl mx-auto py-16 px-4">
        <Skeleton className="h-8 w-1/3 mb-2" />
        <Skeleton className="h-4 w-1/4 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }
  
  if (isError || !album) {
    console.error('Error displaying album:', error);
    
    return (
      <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Album non trouvé ou expiré</h1>
        <p className="mb-8">Le lien de partage que vous avez utilisé n'est plus valide ou a expiré.</p>
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    );
  }
  
  const now = new Date();
  const accessFrom = new Date(album.access_from);
  const accessUntil = new Date(album.access_until);
  const isAccessible = now >= accessFrom && now <= accessUntil;
  
  if (!isAccessible) {
    return (
      <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Album expiré</h1>
        <p className="mb-8">
          Cet album était disponible du {accessFrom.toLocaleDateString()} au {accessUntil.toLocaleDateString()}, mais n'est plus accessible aujourd'hui.
        </p>
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    );
  }
  
  const accessFromFormatted = album?.access_from ? new Date(album.access_from).toLocaleDateString('fr-FR') : '';
  const accessUntilFormatted = album?.access_until ? new Date(album.access_until).toLocaleDateString('fr-FR') : '';
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b sticky top-0 bg-background z-10">
        <div className="container max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <Button variant="ghost" className="p-2" onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                toast({
                  title: "Lien copié",
                  description: "Le lien de partage a été copié dans le presse-papier."
                });
              }}
            >
              <Share className="h-4 w-4 mr-2" />
              Partager
            </Button>
            
            <Button
              onClick={downloadAllImages}
              disabled={isDownloading}
            >
              <Download className="h-4 w-4 mr-2" />
              {isDownloading ? 'Préparation...' : 'Télécharger tout'}
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow container max-w-7xl mx-auto py-8 px-4">
        <div className="mb-12">
          <h1 className="text-3xl font-bold mb-2">{album?.name}</h1>
          {album?.description && (
            <p className="text-muted-foreground mb-2">{album.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Accessible du {accessFromFormatted} au {accessUntilFormatted}
          </p>
        </div>
        
        <MasonryGrid
          images={formatImagesForGrid()}
          isLoading={isLoading}
        />
      </main>
      
      <footer className="border-t py-6">
        <div className="container max-w-7xl mx-auto px-4 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} - Album partagé via Stimergie
        </div>
      </footer>
    </div>
  );
};

export default SharedAlbum;
