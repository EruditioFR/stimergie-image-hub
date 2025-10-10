import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadImage } from '@/utils/image/imageDownloader';
import { toast } from 'sonner';
import { generateDownloadImageHDUrl, generateDownloadImageSDUrl } from '@/utils/image/imageUrlGenerator';
import { parseTagsString } from '@/utils/imageUtils';
import { TagsEditor } from './TagsEditor';
import { ImageSharingManager } from '@/components/images/ImageSharingManager';
import { useAuth } from '@/context/AuthContext';

interface ImageContentProps {
  image: any;
  imageDimensions: { width: number; height: number };
  isFullPage: boolean;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const ImageContent = ({ 
  image, 
  imageDimensions, 
  isFullPage,
  onImageLoad 
}: ImageContentProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [imageError, setImageError] = useState(false);
  const [currentTags, setCurrentTags] = useState(image?.tags);
  const { userRole, isAdmin } = useAuth();

  // Process tags to ensure they're always in array format
  const processTags = (tags: any): string[] => {
    if (!tags) return [];
    
    if (typeof tags === 'string') {
      return parseTagsString(tags);
    } else if (Array.isArray(tags)) {
      return tags;
    }
    
    return [];
  };
  
  const displayTags = processTags(currentTags);
  
  console.log("ImageContent component - Image tags:", image?.tags);
  console.log("ImageContent component - Current tags:", currentTags);
  console.log("ImageContent component - Processed tags:", displayTags);

  const handleDownload = async (isHD: boolean = false) => {
    setIsDownloading(true);
    setDownloadProgress(0);
    let downloadUrl = '';
    
    try {
      if (isHD) {
        // Version HD - Toujours construire l'URL HD depuis folder_name (sans /JPG/)
        if (image?.folder_name && image?.title) {
          downloadUrl = generateDownloadImageHDUrl(image.folder_name, image.title);
        }
        // Fallback HD: Transformer download_url en supprimant /JPG/ si présent
        else if (image?.download_url) {
          downloadUrl = image.download_url.replace('/JPG/', '/');
        }
        // Dernier fallback: URL d'affichage
        else {
          downloadUrl = image?.display_url || image?.url || image?.url_miniature || image?.src || '';
          // Supprimer /JPG/ si présent dans le fallback
          downloadUrl = downloadUrl.replace('/JPG/', '/');
        }
      } else {
        // Version SD - Construire l'URL SD depuis folder_name ou utiliser display_url
        if (image?.folder_name && image?.title) {
          downloadUrl = generateDownloadImageSDUrl(image.folder_name, image.title);
        }
        // Fallback SD: display_url ou url_miniature
        else {
          downloadUrl = image?.display_url || image?.url_miniature || image?.url || image?.src || '';
        }
      }

      if (!downloadUrl) {
        throw new Error('Aucune URL de téléchargement disponible');
      }

      console.log(`Téléchargement ${isHD ? 'HD' : 'SD'} depuis:`, downloadUrl);
      
      // Récupérer l'image via fetch
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Téléchargement avec progression pour les fichiers HD
      const contentLength = response.headers.get('content-length');
      const total = contentLength ? parseInt(contentLength, 10) : 0;

      let blob: Blob;

      if (isHD && total > 0 && response.body) {
        // Streaming avec progression pour HD
        const reader = response.body.getReader();
        const chunks: Uint8Array[] = [];
        let receivedLength = 0;

        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          // Mettre à jour la progression
          const progress = Math.round((receivedLength / total) * 100);
          setDownloadProgress(progress);
        }

        // Reconstruire le blob depuis les chunks
        const chunksAll = new Uint8Array(receivedLength);
        let position = 0;
        for (const chunk of chunks) {
          chunksAll.set(chunk, position);
          position += chunk.length;
        }

        blob = new Blob([chunksAll], { type: 'image/jpeg' });
      } else {
        // Téléchargement classique pour SD ou si pas de progression disponible
        blob = await response.blob();
      }
      
      // Créer une URL Blob locale
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Créer un lien de téléchargement avec l'URL Blob
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${image?.title || 'image'}_${isHD ? 'HD' : 'SD'}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Révoquer l'URL Blob après un délai pour nettoyer la mémoire
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success(`Téléchargement ${isHD ? 'HD' : 'SD'} démarré !`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error(`Impossible de télécharger le fichier: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleDirectDownload = (isHD: boolean = false) => {
    if (image) {
      const downloadUrl = isHD ? 
        (image.download_url || image.url || image.display_url || image.url_miniature || image.src) :
        (image.display_url || image.url_miniature || image.url || image.src);
      
      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${image?.title || 'image'}_${isHD ? 'HD' : 'SD'}.jpg`;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Téléchargement ${isHD ? 'HD' : 'SD'} démarré !`);
      } else {
        toast.error('Aucune URL de téléchargement disponible');
      }
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleTagsUpdated = (newTags: string[]) => {
    setCurrentTags(newTags);
  };

  const imageSrc = imageError 
    ? '/image-not-available.png' 
    : (image?.display_url || image?.url_miniature || image?.src || image?.url || '');

  return (
    <>
      {/* Barre de progression du téléchargement HD - Centrée et visible */}
      {isDownloading && downloadProgress > 0 && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-background border border-border p-8 rounded-xl shadow-2xl min-w-[400px] max-w-[500px]">
            <p className="text-lg font-semibold mb-4 text-center">Téléchargement HD en cours...</p>
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
            <p className="text-base font-medium text-center">{downloadProgress}%</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-xl font-bold flex-1">{image?.title || 'Sans titre'}</h2>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            onClick={() => handleDownload(false)}
            disabled={isDownloading}
            size="sm"
            className="bg-primary text-white hover:bg-primary/90 border-0 font-medium px-4 py-2 min-w-[120px]"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Téléchargement...' : 'SD (Web)'}
          </Button>
          <Button 
            onClick={() => handleDownload(true)}
            disabled={isDownloading}
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700 border-0 font-medium px-4 py-2 min-w-[140px]"
          >
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? 'Téléchargement...' : 'HD (Impression)'}
          </Button>
        </div>
      </div>
      
      <div className="relative rounded-md overflow-hidden flex justify-center">
        <div 
          className="relative"
          style={{ 
            overflow: 'hidden', 
            height: 'auto'
          }}
        >
          <img 
            src={imageSrc}
            alt={image?.title || 'Image'} 
            className={`max-w-full ${isFullPage ? 'max-h-[80vh]' : 'max-h-[70vh]'} object-contain`}
            onLoad={onImageLoad}
            onError={handleImageError}
          />
        </div>
      </div>
      
      {/* Éditeur de tags */}
      <TagsEditor 
        imageId={image?.id?.toString() || ''}
        initialTags={displayTags}
        onTagsUpdated={handleTagsUpdated}
      />
      
      {/* Image sharing for admins */}
      {userRole === 'admin' && (
        <ImageSharingManager 
          imageId={parseInt(image?.id)}
          primaryClientId={image?.projets?.clients?.id}
        />
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>
            <span className="block text-foreground font-medium">Dimensions</span>
            <span>{imageDimensions.width || image?.width || '–'} × {imageDimensions.height || image?.height || '–'}</span>
          </div>
          {(image?.folder_name || image?.projets?.nom_dossier) && (
            <div>
              <span className="block text-foreground font-medium">Dossier</span>
              <span>{image?.folder_name || image?.projets?.nom_dossier}</span>
            </div>
          )}
          {image?.orientation && (
            <div>
              <span className="block text-foreground font-medium">Orientation</span>
              <span className="capitalize">{image.orientation}</span>
            </div>
          )}
          <div>
            <span className="block text-foreground font-medium">Copyright</span>
            <span>{image?.copyright || 'Stimergie'}</span>
          </div>
          {image?.created_at && (
            <div>
              <span className="block text-foreground font-medium">Date d'ajout</span>
              <span>{new Date(image.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-4">
          {/* Show shared clients if any (admin only) */}
          {userRole === 'admin' && image?.image_shared_clients && image.image_shared_clients.length > 0 && (
            <div>
              <span className="block text-foreground font-medium">Également partagé avec</span>
              <p className="text-muted-foreground">
                {image.image_shared_clients.map((shared: any) => shared.clients?.nom).filter(Boolean).join(', ')}
              </p>
            </div>
          )}
          
          {image?.description && (
            <div>
              <span className="block text-foreground font-medium">Description</span>
              <p className="text-muted-foreground">{image.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};