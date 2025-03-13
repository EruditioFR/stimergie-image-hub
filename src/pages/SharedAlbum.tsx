
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, Calendar, Download } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';

interface Album {
  id: string;
  name: string;
  description: string | null;
  access_from: string;
  access_until: string;
  images: AlbumImage[];
}

interface AlbumImage {
  id: number;
  title: string;
  description: string | null;
  url: string;
  width: number;
  height: number;
  orientation: string;
}

export default function SharedAlbum() {
  const { shareKey } = useParams<{ shareKey: string }>();
  const navigate = useNavigate();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function fetchAlbum() {
      if (!shareKey) {
        toast.error('Clé de partage invalide');
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('get_album_by_share_key', { share_key_param: shareKey });

        if (error) {
          throw error;
        }

        if (!data || data.length === 0) {
          toast.error("Cet album n'existe pas ou n'est plus accessible");
          navigate('/');
          return;
        }

        // Le RPC retourne toujours un tableau, même s'il n'y a qu'un résultat
        setAlbum(data[0] as Album);
      } catch (error: any) {
        console.error('Erreur lors de la récupération de l\'album:', error);
        toast.error(`Une erreur est survenue: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }

    fetchAlbum();
  }, [shareKey, navigate]);

  // Format les images pour le composant MasonryGrid
  const formatImagesForGrid = (images: AlbumImage[] = []) => {
    return images.map((image) => ({
      id: image.id.toString(),
      src: image.url,
      alt: image.title,
      title: image.title,
      author: 'User',
      orientation: image.orientation
    }));
  };

  // Télécharger toutes les images de l'album
  const downloadAllImages = async () => {
    if (!album || album.images.length === 0) {
      toast.error("Aucune image à télécharger");
      return;
    }

    setIsDownloading(true);
    toast.info("Préparation du téléchargement...");

    try {
      const zip = new JSZip();
      
      // Add each image to the zip file
      const fetchPromises = album.images.map(async (img) => {
        try {
          const response = await fetch(img.url);
          if (!response.ok) throw new Error(`Failed to fetch ${img.url}`);
          
          const blob = await response.blob();
          // Get file extension from URL
          const extension = img.url.split('.').pop() || 'jpg';
          // Use image title or id as filename
          const filename = `${img.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${img.id}.${extension}`;
          
          zip.file(filename, blob);
          return true;
        } catch (error) {
          console.error(`Error fetching ${img.url}:`, error);
          return false;
        }
      });
      
      await Promise.all(fetchPromises);
      
      // Generate the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `album_${album.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.zip`);
      
      toast.success("Téléchargement prêt");
    } catch (error) {
      console.error("Error creating zip:", error);
      toast.error("Une erreur est survenue lors du téléchargement");
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <AlertTriangle className="h-16 w-16 text-yellow-500" />
              </div>
              <h1 className="text-2xl font-bold">Album introuvable</h1>
              <p className="mt-2 text-muted-foreground">
                Cet album n'existe pas ou n'est plus accessible.
              </p>
              <Button
                onClick={() => navigate('/')}
                className="mt-6"
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isExpired = new Date(album.access_until) < new Date();
  const startDate = new Date(album.access_from);
  const endDate = new Date(album.access_until);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-lg shadow-sm p-6 mb-8">
            <h1 className="text-2xl font-bold">{album.name}</h1>
            {album.description && (
              <p className="text-muted-foreground mt-2">{album.description}</p>
            )}
            
            <div className="flex flex-wrap items-center gap-4 mt-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 mr-1" />
                Disponible du {format(startDate, 'dd MMMM yyyy', { locale: fr })} au {format(endDate, 'dd MMMM yyyy', { locale: fr })}
              </div>

              {isExpired ? (
                <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">
                  Expiré
                </div>
              ) : (
                <div className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-green-100 text-green-800">
                  Actif
                </div>
              )}
            </div>

            {!isExpired && album.images.length > 0 && (
              <div className="mt-6">
                <Button 
                  onClick={downloadAllImages}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  {isDownloading ? 'Préparation...' : `Télécharger toutes les images (${album.images.length})`}
                </Button>
              </div>
            )}
          </div>

          {isExpired ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-xl font-medium">Cet album a expiré</h2>
              <p className="text-muted-foreground mt-2">
                Les images ne sont plus accessibles car la période de partage est terminée.
              </p>
            </div>
          ) : album.images.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <h2 className="text-xl font-medium">Cet album ne contient aucune image</h2>
            </div>
          ) : (
            <MasonryGrid images={formatImagesForGrid(album.images)} />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
