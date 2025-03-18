
import { useState, memo, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LazyImage, LazyImageWithPriority } from '@/components/LazyImage';
import { cn } from '@/lib/utils';

interface ImageCardProps {
  id: string;
  src: string;
  alt: string;
  title: string;
  author: string;
  className?: string;
  orientation?: string;
  onClick?: (e: React.MouseEvent) => void;
}

// Composant mémoïsé pour éviter les rendus inutiles
export const ImageCard = memo(function ImageCard({ 
  id, src, alt, title, author, className, orientation, onClick 
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    // Add timestamp to prevent caching
    const preventCaching = (url: string) => {
      if (!url) return url;
      return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
    };
    
    // Optimize the URL without caching
    if (src) {
      setOptimizedSrc(preventCaching(src));
    }
    
    return () => {
      mountedRef.current = false;
    };
  }, [src]);

  // Obtenir le ratio d'aspect approprié en fonction de l'orientation de l'image
  const getAspectRatio = () => {
    switch (orientation?.toLowerCase()) {
      case 'landscape':
        return 'aspect-[4/3]';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'square':
        return 'aspect-square';
      default:
        return 'aspect-auto';
    }
  };
  
  // Donner la priorité aux images en haut de la page
  // Les 10 premières images sont prioritaires (increased from 6)
  const isPriority = parseInt(id) % 15 < 10; 

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
        {isPriority ? (
          <LazyImageWithPriority
            src={optimizedSrc} 
            alt={alt} 
            className={`w-full ${getAspectRatio()}`}
            objectFit="object-cover"
            priority={true}
          />
        ) : (
          <LazyImage 
            src={optimizedSrc} 
            alt={alt} 
            className={`w-full ${getAspectRatio()}`}
            objectFit="object-cover"
          />
        )}
        
        {/* Superposition au survol */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex flex-col justify-end p-4"
        )}>
          <h3 className="text-white font-medium truncate">{title}</h3>
          <p className="text-white/80 text-sm">Par {author}</p>
        </div>
      </div>
      
      {/* Bouton de téléchargement */}
      <div className={cn(
        "absolute top-3 right-3 transform",
        "transition-all duration-300 ease-in-out",
        isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}>
        <Button 
          size="icon" 
          variant="secondary" 
          className="bg-white/90 hover:bg-white w-8 h-8 rounded-full shadow-md"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            window.open(src, '_blank');
          }}
        >
          <Download className="h-4 w-4 text-foreground" />
          <span className="sr-only">Télécharger</span>
        </Button>
      </div>
    </div>
  );
});

export default ImageCard;
