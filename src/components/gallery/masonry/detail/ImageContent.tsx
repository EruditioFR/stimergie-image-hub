import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { downloadImage } from '@/utils/image/imageDownloader';
import { toast } from 'sonner';
import { generateDownloadImageHDUrl, generateDownloadImageSDUrl } from '@/utils/image/imageUrlGenerator';
import { parseTagsString } from '@/utils/imageUtils';
import { TagsEditor } from './TagsEditor';
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
  const [imageError, setImageError] = useState(false);
  const [currentTags, setCurrentTags] = useState(image?.tags);
  const { userRole } = useAuth();

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
    let downloadUrl = '';
    
    try {
      if (isHD) {
        // Version HD - Priorité 1: download_url (version HD)
        if (image?.download_url) {
          downloadUrl = image.download_url;
        }
        // Priorité 2: Construire l'URL HD depuis folder_name
        else if (image?.folder_name && image?.title) {
          downloadUrl = generateDownloadImageHDUrl(image.folder_name, image.title);
        }
        // Fallback HD: URL d'affichage
        else {
          downloadUrl = image?.display_url || image?.url || image?.url_miniature || image?.src || '';
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

      // Télécharger l'image comme blob pour forcer le téléchargement
      const response = await fetch(downloadUrl, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Erreur réseau: ${response.status}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Créer un lien temporaire pour le téléchargement
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${image?.title || 'image'}_${isHD ? 'HD' : 'SD'}.jpg`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Nettoyer l'URL blob
      URL.revokeObjectURL(blobUrl);
      
      toast.success(`Téléchargement ${isHD ? 'HD' : 'SD'} terminé !`);
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      // En cas d'erreur, essayer un téléchargement direct simple
      if (downloadUrl) {
        try {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${image?.title || 'image'}_${isHD ? 'HD' : 'SD'}.jpg`;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast.info('Téléchargement initié - si l\'image s\'ouvre, faites clic droit > Enregistrer sous...');
        } catch (linkError) {
          console.error('Erreur lors du téléchargement direct:', linkError);
          toast.error('Impossible de télécharger le fichier');
        }
      } else {
        toast.error('Aucune URL de téléchargement disponible');
      }
    } finally {
      setIsDownloading(false);
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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          <div>
            <span className="block text-foreground font-medium">Dimensions</span>
            <span>{imageDimensions.width || image?.width || '–'} × {imageDimensions.height || image?.height || '–'}</span>
          </div>
          {image?.orientation && (
            <div>
              <span className="block text-foreground font-medium">Orientation</span>
              <span className="capitalize">{image.orientation}</span>
            </div>
          )}
          {image?.created_at && (
            <div>
              <span className="block text-foreground font-medium">Date d'ajout</span>
              <span>{new Date(image.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
        
        {image?.description && (
          <div>
            <span className="block text-foreground font-medium">Description</span>
            <p className="text-muted-foreground">{image.description}</p>
          </div>
        )}
      </div>
    </div>
  );
};