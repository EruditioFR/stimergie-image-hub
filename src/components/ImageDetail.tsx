
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useImages } from '@/context/ImageContext';
import { Button } from '@/components/ui/button';
import { X, Download } from 'lucide-react';
import { downloadImage } from '@/utils/image/download';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { parseTagsString } from '@/utils/imageUtils';
import { supabase } from '@/integrations/supabase/client';

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { images } = useImages();
  const [isDownloading, setIsDownloading] = useState(false);
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [folderName, setFolderName] = useState<string | null>(null);
  
  useEffect(() => {
    console.log(`Recherche d'image avec ID: ${id} parmi ${images.length} images`);
    
    if (id && images.length > 0) {
      const foundImage = images.find(img => img.id === id);
      setImage(foundImage || null);
      
      // Si on a une image avec un id_projet, chercher le nom du dossier
      if (foundImage && foundImage.id_projet) {
        const fetchFolderName = async () => {
          try {
            const { data, error } = await supabase
              .from('projets')
              .select('nom_dossier')
              .eq('id', foundImage.id_projet)
              .single();
              
            if (error) throw error;
            
            if (data && data.nom_dossier) {
              setFolderName(data.nom_dossier);
              console.log(`Folder name found for project ${foundImage.id_projet}: ${data.nom_dossier}`);
            }
          } catch (err) {
            console.error('Error fetching folder name:', err);
          }
        };
        
        fetchFolderName();
      } else if (foundImage && foundImage.projets?.nom_dossier) {
        setFolderName(foundImage.projets.nom_dossier);
      }
    } else {
      setImage(null);
    }
    setLoading(false);
  }, [id, images]);
  
  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <LoadingSpinner size={40} />
      </div>
    );
  }
  
  if (!image) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Image introuvable</h2>
            <p className="mb-6">L'image que vous recherchez n'existe pas ou a été supprimée.</p>
            <Button onClick={() => navigate('/gallery')}>Retour à la galerie</Button>
          </div>
        </div>
      </div>
    );
  }
  
  const handleClose = () => {
    navigate(-1);
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    
    setIsDownloading(true);
    
    console.log(`Downloading image:`, image);
    
    try {
      // Si on a un nom de dossier, on utilise l'URL HD directe
      let downloadUrl = image.download_url || image.url || image.src;
      
      if (folderName && image.title) {
        // Format direct pour les téléchargements HD: https://www.stimergie.fr/photos/[nom_du_dossier]/[titre_image].jpg
        const cleanTitle = image.title.replace(/\.(jpg|jpeg|png)$/i, '');
        downloadUrl = `https://www.stimergie.fr/photos/${encodeURIComponent(folderName)}/${encodeURIComponent(cleanTitle)}.jpg`;
        console.log(`Generated direct HD URL for download: ${downloadUrl}`);
      }
      
      const filename = `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
      await downloadImage(downloadUrl, filename);
      toast.success(`Image téléchargée`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Échec du téléchargement');
    } finally {
      setIsDownloading(false);
    }
  };

  const processTags = (tags: any): string[] => {
    if (!tags) return [];
    
    if (typeof tags === 'string') {
      return parseTagsString(tags);
    } else if (Array.isArray(tags)) {
      return tags;
    }
    
    return [];
  };
  
  const displayTags = processTags(image?.tags);
  
  console.log("Image tags:", image?.tags);
  console.log("Processed display tags:", displayTags);
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50 p-4">
      <div className="bg-card rounded-lg shadow-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-4 flex justify-between items-center border-b">
          <h2 className="text-xl font-bold truncate">{image.title}</h2>
          <Button variant="ghost" size="icon" onClick={handleClose} className="ml-auto">
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex-1 overflow-auto p-6">
          <div className="max-h-[60vh] flex justify-center">
            <img 
              src={image.display_url || image.src} 
              alt={image.alt || image.title} 
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                console.error('Image load error');
                const imgElement = e.target as HTMLImageElement;
                if (image.url_miniature && imgElement.src !== image.url_miniature) {
                  imgElement.src = image.url_miniature;
                } else if (image.url && imgElement.src !== image.url) {
                  imgElement.src = image.url;
                }
              }}
            />
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{image.title}</h3>
              <div>
                <Button 
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="flex items-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <LoadingSpinner className="mr-1" size={16} />
                      <span>Téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>Télécharger</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Par {image.author || 'Photographe inconnu'}
            </p>
            
            {displayTags.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Tags:</p>
                <div className="flex flex-wrap gap-2">
                  {displayTags.map((tag: string, index: number) => (
                    <span 
                      key={index} 
                      className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
