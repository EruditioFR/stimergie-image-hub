
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useImages } from '@/context/ImageContext';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { X, Download } from 'lucide-react';
import { downloadImage } from '@/utils/image/imageDownloader';
import { toast } from 'sonner';

export default function ImageDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { images } = useImages();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const image = images.find(img => img.id === id);
  
  if (!image) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        <div className="bg-card p-8 rounded-lg shadow-lg max-w-2xl w-full">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Image introuvable</h2>
            <p className="mb-6">L'image que vous recherchez n'existe pas ou a été supprimée.</p>
            <Button onClick={() => navigate(-1)}>Retour</Button>
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
    
    try {
      await downloadImage(image.src, `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Échec du téléchargement');
    } finally {
      setIsDownloading(false);
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
              src={image.src} 
              alt={image.alt} 
              className="max-w-full max-h-full object-contain"
            />
          </div>
          
          <div className="mt-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{image.title}</h3>
              <Button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2"
              >
                <Download className={`h-4 w-4 ${isDownloading ? 'animate-pulse' : ''}`} />
                <span>Télécharger</span>
              </Button>
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
