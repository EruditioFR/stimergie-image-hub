
import { useState, memo, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { downloadImage } from '@/utils/image/download';
import { toast } from 'sonner';
import { validateImageUrl } from '@/utils/image/errorHandler';
import { LazyImage } from '@/components/gallery/masonry/LazyImage';
import { DownloadProgressOverlay } from '@/components/gallery/DownloadProgressOverlay';

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
  download_url_sd?: string;
  width?: number;
  height?: number;
  url?: string; // Original URL from database
}

export const ImageCard = memo(function ImageCard({ 
  id, src, alt, title, author, className, orientation, onClick, downloadUrl, download_url_sd, width, height, url
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [imageError, setImageError] = useState(false);
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
      case 'paysage':
      case 'landscape':
        return 4/3;
      case 'portrait':
        return 3/4;
      case 'carré':
      case 'square':
        return 1;
      default:
        return undefined;
    }
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDownloading) return;
    
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadComplete(false);
    
    try {
      // Prioritize the original URL from database
      let downloadTarget = url || download_url_sd || downloadUrl || src;
      
      const validationResult = validateImageUrl(downloadTarget, id, title);
      if (!validationResult.isValid) {
        throw new Error(validationResult.error || `URL manquante pour l'image ${id}: ${title}`);
      }
      
      // Use the validated URL (which might have been fixed)
      downloadTarget = validationResult.url || downloadTarget;
      
      // Détecter si c'est une URL basse définition et la transformer en HD
      const isJPGUrl = downloadTarget.includes('/JPG/');
      if (isJPGUrl) {
        downloadTarget = downloadTarget.replace('/JPG/', '/');
      }
      
      // Fetch avec suivi de progression en temps réel
      const response = await fetch(downloadTarget, {
        mode: 'cors',
        credentials: 'omit',
        headers: { 'Accept': 'image/jpeg,image/jpg,image/png,image/*' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const reader = response.body?.getReader();
      let blob: Blob;
      
      // Vérifier si le body n'est pas déjà consommé et si on peut lire le stream
      if (reader && contentLength > 0 && !response.bodyUsed) {
        let receivedLength = 0;
        const chunks: Uint8Array[] = [];
        const startTime = Date.now();
        
        console.log(`[ImageCard] Début téléchargement HD: ${(contentLength / 1024 / 1024).toFixed(1)} MB`);
        
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            if (value) {
              chunks.push(value);
              receivedLength += value.length;
              const progress = Math.round((receivedLength / contentLength) * 100);
              
              // Mise à jour de la progression en temps réel
              if (!mountedRef.current) break;
              setDownloadProgress(progress);
              
              // Log tous les 10%
              if (progress % 10 === 0) {
                const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
                console.log(`[ImageCard] Progression: ${progress}% (${elapsed}s)`);
              }
            }
          }
          
          console.log(`[ImageCard] Téléchargement terminé: 100%`);
          
          const isPngUrl = downloadTarget.toLowerCase().includes('.png');
          blob = new Blob(chunks as BlobPart[], { type: isPngUrl ? 'image/png' : 'image/jpeg' });
        } catch (readerError) {
          console.warn('[ImageCard] Erreur lecture stream, fallback sur blob():', readerError);
          // Fallback : Si erreur pendant la lecture du stream, utiliser blob()
          blob = await response.blob();
        }
      } else {
        // Fallback : Body déjà consommé ou pas de reader/content-length
        console.log('[ImageCard] Body déjà consommé ou pas de content-length, utilisation de blob()');
        blob = await response.blob();
      }
      
      // Déterminer l'extension du fichier
      const isPngUrl = downloadTarget.toLowerCase().includes('.png');
      const fileExtension = isPngUrl ? '.png' : '.jpg';
      
      // Télécharger le fichier
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      
      const filename = title 
        ? `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_HD${fileExtension}` 
        : `image_${id}_HD${fileExtension}`;
      
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
      
      // Animation de succès
      setDownloadComplete(true);
      const fileSize = blob.size > 0 ? (blob.size / 1024 / 1024).toFixed(1) : (contentLength / 1024 / 1024).toFixed(1);
      toast.success(`Image HD téléchargée (${fileSize} MB)`);
      
      setTimeout(() => {
        setDownloadComplete(false);
        setIsDownloading(false);
        setDownloadProgress(0);
      }, 1500);
    } catch (error) {
      console.error(`Erreur lors du téléchargement:`, error);
      toast.error('Échec du téléchargement HD', { 
        description: 'Une erreur s\'est produite lors du téléchargement de l\'image.' 
      });
      setIsDownloading(false);
      setDownloadProgress(0);
      setDownloadComplete(false);
    }
  };

  const handleImageError = () => {
    setImageError(true);
    console.warn(`Failed to load image: ${id} - ${title}`);
  };

  const aspectRatio = getAspectRatio();
  const shouldUseAspectRatio = aspectRatio !== undefined;
  const imageSrc = imageError ? '/image-not-available.png' : src;

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
            <LazyImage
              src={imageSrc}
              alt={alt}
              aspectRatio={aspectRatio}
              className="w-full h-full"
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          </AspectRatio>
        ) : (
          <LazyImage
            src={imageSrc}
            alt={alt}
            className="w-full"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
        )}
        
        {/* Overlay de progression de téléchargement */}
        {isDownloading && (
          <DownloadProgressOverlay 
            progress={downloadProgress}
            isComplete={downloadComplete}
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
      
      <div className="absolute top-3 right-3 transform">
        <div className={cn(
          "transform transition-all duration-300 ease-in-out",
          (isHovered || isDownloading) ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}>
          <Button 
            size="icon" 
            variant="secondary" 
            className={cn(
              "w-8 h-8 rounded-full shadow-md transition-all duration-300",
              isDownloading 
                ? "bg-primary text-white animate-pulse" 
                : "bg-white/90 hover:bg-white"
            )}
            onClick={handleDownload}
            disabled={isDownloading}
            title="Télécharger"
          >
            <Download className={cn(
              "h-4 w-4 transition-transform duration-500",
              isDownloading ? "animate-spin" : "",
              isDownloading ? "text-white" : "text-foreground"
            )} />
            <span className="sr-only">Télécharger</span>
          </Button>
        </div>
      </div>
    </div>
  );
});

export default ImageCard;
