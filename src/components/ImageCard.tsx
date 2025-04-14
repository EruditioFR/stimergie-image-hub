
import { useState, memo, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { downloadImage } from '@/utils/image/imageDownloader';
import { toast } from 'sonner';

interface ImageCardProps {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  className?: string;
  orientation?: string;
  onClick?: (e: React.MouseEvent) => void;
  downloadUrl?: string;
  width?: number;
  height?: number;
}

export const ImageCard = memo(function ImageCard({ 
  id, src, alt, title, author, className, orientation, onClick, downloadUrl, width, height
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState(false);
  const [naturalRatio, setNaturalRatio] = useState<number | undefined>(undefined);
  const imageRef = useRef<HTMLImageElement>(null);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (imageRef.current) {
      if (imageRef.current.complete) {
        handleImageLoad();
      }
    }
  }, [imageRef.current]);

  const handleImageLoad = () => {
    if (!mountedRef.current) return;
    
    if (imageRef.current) {
      const imgElement = imageRef.current;
      if (imgElement.naturalWidth && imgElement.naturalHeight) {
        setNaturalRatio(imgElement.naturalWidth / imgElement.naturalHeight);
      }
      setImageLoaded(true);
    }
  };

  const getAspectRatio = () => {
    if (width && height && width > 0 && height > 0) {
      return width / height;
    }

    if (naturalRatio && naturalRatio > 0) {
      return naturalRatio;
    }
    
    switch (orientation?.toLowerCase()) {
      case 'landscape':
        return 4/3;
      case 'portrait':
        return 3/4;
      case 'square':
        return 1;
      default:
        return undefined;
    }
  };

  const handleDownload = async (e: React.MouseEvent, format: 'jpg' | 'png' = 'jpg') => {
    e.preventDefault();
    e.stopPropagation();
    
    if ((format === 'jpg' && isDownloading) || (format === 'png' && isDownloadingPng)) return;
    
    if (format === 'jpg') {
      setIsDownloading(true);
    } else {
      setIsDownloadingPng(true);
    }
    
    try {
      const url = downloadUrl || src;
      console.log(`Download requested for URL (${format}):`, url);
      
      const filename = title 
        ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${format}` 
        : `image_${id}.${format}`;
      
      await downloadImage(url, filename, format);
    } catch (error) {
      console.error(`Erreur lors du téléchargement (${format}):`, error);
      toast.error('Échec du téléchargement', { 
        description: 'Une erreur s\'est produite lors du téléchargement de l\'image.' 
      });
    } finally {
      if (format === 'jpg') {
        setIsDownloading(false);
      } else {
        setIsDownloadingPng(false);
      }
    }
  };

  const aspectRatio = getAspectRatio();
  const shouldUseAspectRatio = aspectRatio !== undefined;

  return (
    <div 
      className={cn(
        "image-card group overflow-hidden bg-card",
        "transition-all duration-300 ease-in-out",
        "shadow-none hover:shadow-sm",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
    >
      <div className="block relative">
        {shouldUseAspectRatio ? (
          <AspectRatio ratio={aspectRatio}>
            <img 
              ref={imageRef}
              src={src}
              alt={alt} 
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={handleImageLoad}
            />
          </AspectRatio>
        ) : (
          <img 
            ref={imageRef}
            src={src}
            alt={alt} 
            className="w-full object-contain"
            loading="lazy"
            style={{ maxHeight: '80vh' }}
            onLoad={handleImageLoad}
          />
        )}
        
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex flex-col justify-end p-4"
        )}>
          <h3 className="text-white font-medium truncate">{title}</h3>
        </div>
      </div>
      
      <div className="absolute top-3 flex items-center gap-2">
        {/* PNG download button (left side) */}
        <div className={cn(
          "left-3 transform",
          "transition-all duration-300 ease-in-out",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}>
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-white/90 hover:bg-white w-8 h-8 rounded-full shadow-md"
            onClick={(e) => handleDownload(e, 'png')}
            disabled={isDownloadingPng}
            title="Télécharger en PNG"
          >
            <Download className={`h-4 w-4 ${isDownloadingPng ? 'animate-pulse' : ''} text-emerald-600`} />
            <span className="sr-only">Télécharger en PNG</span>
          </Button>
        </div>
        
        {/* JPG download button (right side) */}
        <div className={cn(
          "right-3 absolute transform",
          "transition-all duration-300 ease-in-out",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}>
          <Button 
            size="icon" 
            variant="secondary" 
            className="bg-white/90 hover:bg-white w-8 h-8 rounded-full shadow-md"
            onClick={(e) => handleDownload(e, 'jpg')}
            disabled={isDownloading}
            title="Télécharger en JPG"
          >
            <Download className={`h-4 w-4 ${isDownloading ? 'animate-pulse' : ''} text-foreground`} />
            <span className="sr-only">Télécharger en JPG</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ImageCard;
