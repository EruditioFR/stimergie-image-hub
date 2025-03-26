
import { useState } from 'react';
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
import { generateDisplayImageUrl, generateDownloadImageUrl } from '@/utils/image/imageUrlGenerator';

const SharedAlbum = () => {
  const { albumKey } = useParams<{ albumKey: string }>();
  const navigate = useNavigate();
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();
  
  const fetchAlbumData = async () => {
    if (!albumKey) throw new Error('No album key provided');
    
    const { data, error } = await supabase.rpc('get_album_by_share_key', {
      share_key_param: albumKey
    });
    
    if (error) {
      console.error('Error fetching album:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      throw new Error('Album not found or expired');
    }
    
    return data[0];
  };
  
  const { data: album, isLoading, isError } = useQuery({
    queryKey: ['shared-album', albumKey],
    queryFn: fetchAlbumData
  });
  
  const downloadAllImages = async () => {
    if (!album || !album.images || album.images.length === 0) return;
    
    setIsDownloading(true);
    toast({
      title: "Préparation du téléchargement",
      description: "Nous préparons votre téléchargement...",
    });
    
    try {
      const zip = new JSZip();
      
      // Add each image to the zip file
      const fetchPromises = album.images.map(async (image: any, index: number) => {
        try {
          // Create proper download URL from image data
          const folderName = image.id_projet ? 
            await getFolderName(image.id_projet) : 
            "unknown-folder";
          
          const imageTitle = image.title || `image-${image.id}`;
          const downloadUrl = generateDownloadImageUrl(folderName, imageTitle);
          
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
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: 'blob' });
      
      // Save the zip file
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
  
  // Helper function to get folder name for an image
  const getFolderName = async (projectId: string): Promise<string> => {
    try {
      const { data, error } = await supabase
        .from('projets')
        .select('nom_dossier')
        .eq('id', projectId)
        .single();
      
      if (error) throw error;
      return data.nom_dossier || '';
    } catch (err) {
      console.error('Error getting folder name:', err);
      return '';
    }
  };
  
  // Format the images for the MasonryGrid component
  const formatImagesForGrid = (): Image[] => {
    if (!album || !album.images) return [];
    
    return album.images.map((image: any) => {
      // Generate proper URLs for the image
      const folderName = image.id_projet ? 
        "unknown-folder" : // This will be replaced when we fetch folder names
        "unknown-folder";
      
      const imageTitle = image.title || `image-${image.id}`;
      const display_url = generateDisplayImageUrl(folderName, imageTitle);
      const download_url = generateDownloadImageUrl(folderName, imageTitle);
      
      return {
        id: image.id.toString(),
        src: display_url,
        display_url: display_url,
        download_url: download_url,
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
    return (
      <div className="container max-w-7xl mx-auto py-16 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Album non trouvé ou expiré</h1>
        <p className="mb-8">Le lien de partage que vous avez utilisé n'est plus valide ou a expiré.</p>
        <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
      </div>
    );
  }
  
  // Check if the album has expired
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
  
  // Format dates for display
  const accessFromFormatted = accessFrom.toLocaleDateString('fr-FR');
  const accessUntilFormatted = accessUntil.toLocaleDateString('fr-FR');
  
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
          <h1 className="text-3xl font-bold mb-2">{album.name}</h1>
          {album.description && (
            <p className="text-muted-foreground mb-2">{album.description}</p>
          )}
          <p className="text-sm text-muted-foreground">
            Accessible du {accessFromFormatted} au {accessUntilFormatted}
          </p>
        </div>
        
        <MasonryGrid
          images={formatImagesForGrid()}
          isLoading={false}
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
