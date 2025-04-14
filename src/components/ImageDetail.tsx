
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useImages } from '@/context/ImageContext';
import { Button } from '@/components/ui/button';
import { X, Download, FileImage } from 'lucide-react';
import { downloadImage } from '@/utils/image/download';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ImageDownloadFormat } from '@/utils/image/download/singleImageDownloader';

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { images } = useImages();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [image, setImage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Trouver l'image correspondante
  useEffect(() => {
    console.log(`Recherche d'image avec ID: ${id} parmi ${images.length} images`);
    
    if (id && images.length > 0) {
      const foundImage = images.find(img => img.id === id);
      setImage(foundImage || null);
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

  const handleDownload = async (format: ImageDownloadFormat = 'original') => {
    if ((format === 'original' && isDownloading) || (format === 'png' && isDownloadingPng)) return;
    
    if (format === 'original') {
      setIsDownloading(true);
    } else {
      setIsDownloadingPng(true);
    }
    
    console.log(`Downloading image in ${format} format:`, image.src);
    
    try {
      // URL pour téléchargement
      const downloadUrl = image.download_url || image.url || image.src;
      
      // Générer un nom de fichier approprié
      const fileExt = format === 'png' ? 'png' : 'jpg';
      const filename = `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${fileExt}`;
      
      // Utiliser l'URL exacte de l'image sans la modifier
      await downloadImage(downloadUrl, filename, format);
      toast.success(`Image téléchargée en ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Échec du téléchargement');
    } finally {
      if (format === 'original') {
        setIsDownloading(false);
      } else {
        setIsDownloadingPng(false);
      }
    }
  };
  
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
                // Fallback à une autre URL si disponible
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
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleDownload('png')}
                  disabled={isDownloadingPng}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {isDownloadingPng ? (
                    <>
                      <LoadingSpinner className="mr-1" size={16} />
                      <span>Téléchargement...</span>
                    </>
                  ) : (
                    <>
                      <FileImage className="h-4 w-4" />
                      <span>PNG</span>
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={() => handleDownload('original')}
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
          </div>
        </div>
      </div>
    </div>
  );
}
