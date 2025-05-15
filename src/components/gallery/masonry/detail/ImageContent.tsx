
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { downloadImage } from '@/utils/image/imageDownloader';
import { toast } from 'sonner';
import { parseTagsString } from '@/utils/imageUtils';

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
  
  const displayTags = processTags(image?.tags);
  
  console.log("ImageContent component - Image tags:", image?.tags);
  console.log("ImageContent component - Processed tags:", displayTags);

  const handleDownload = async () => {
    if (image && !isDownloading) {
      setIsDownloading(true);
      
      try {
        // Get the best quality image URL available
        const downloadUrl = image.download_url || image.url || image.display_url || image.url_miniature || image.src;
        console.log('Detail modal download requested for URL:', downloadUrl);
        
        if (downloadUrl) {
          // Create a descriptive filename based on the image title
          const filename = image.title 
            ? `${image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg` 
            : `image_${image.id || 'download'}.jpg`;
          
          await downloadImage(downloadUrl, filename);
        } else {
          console.error('Aucune URL de téléchargement disponible pour cette image');
          toast.error('URL de téléchargement manquante');
        }
      } catch (error) {
        console.error('Erreur lors du téléchargement:', error);
        toast.error('Échec du téléchargement', { 
          description: 'Une erreur s\'est produite lors du téléchargement de l\'image.' 
        });
      } finally {
        setIsDownloading(false);
      }
    }
  };

  const handleDirectDownload = () => {
    if (image) {
      const downloadUrl = image.download_url || image.url || image.display_url || image.url_miniature || image.src;
      if (downloadUrl) {
        // Ouvrir dans un nouvel onglet pour téléchargement manuel
        window.open(downloadUrl, '_blank');
        toast.info('Image ouverte dans un nouvel onglet', {
          description: 'Pour télécharger: clic droit sur l\'image et sélectionnez "Enregistrer l\'image sous..."'
        });
      }
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const imageSrc = imageError 
    ? '/image-not-available.png' 
    : (image?.display_url || image?.url_miniature || image?.src || image?.url || '');

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">{image?.title || 'Sans titre'}</h2>
        <div className="flex items-center gap-2">
          {/* Button removed as requested */}
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
      
      {/* Affichage des tags avec hashtag */}
      {displayTags && displayTags.length > 0 && (
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
      )}
      
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
