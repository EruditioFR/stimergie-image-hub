
import { useState, memo, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/LazyImage';
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

// Interface pour définir le type de NetworkInformation
interface NetworkInformation {
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

// Étendre l'interface Navigator pour inclure connection
interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
}

// Composant mémoïsé pour éviter les rendus inutiles
export const ImageCard = memo(function ImageCard({ 
  id, src, alt, title, author, className, orientation, onClick 
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [optimizedSrc, setOptimizedSrc] = useState(src);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    // Optimiser l'URL en ajoutant des paramètres de redimensionnement si possible
    const optimizeImageUrl = (url: string) => {
      // Ne pas modifier les URLs déjà optimisées
      if (url.includes('w=') || url.includes('width=')) {
        return url;
      }
      
      // Adapter la qualité en fonction de la connexion réseau
      let quality = 75; // Qualité par défaut
      
      if (typeof navigator !== 'undefined') {
        const nav = navigator as NavigatorWithConnection;
        // Si la connexion est lente, réduire la qualité
        if (nav.connection && (nav.connection.effectiveType === '2g' || nav.connection.effectiveType === 'slow-2g')) {
          quality = 50;
        }
      }
      
      // Déterminer la largeur maximale de l'image (limitée à la taille de l'écran)
      const maxWidth = Math.min(window.innerWidth, 800);
      
      // Ajouter des paramètres à l'URL
      if (url.includes('?')) {
        return `${url}&w=${maxWidth}&q=${quality}`;
      } else {
        return `${url}?w=${maxWidth}&q=${quality}`;
      }
    };
    
    // Si nous avons une URL d'image, l'optimiser
    if (src) {
      const optimized = optimizeImageUrl(src);
      if (mountedRef.current) {
        setOptimizedSrc(optimized);
      }
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
  // Les 6 premières images de chaque lot sont prioritaires
  const isPriority = parseInt(id) % 15 < 6; 

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
        <LazyImage 
          src={optimizedSrc} 
          alt={alt} 
          className={`w-full ${getAspectRatio()}`}
          objectFit="object-cover"
          priority={isPriority}
        />
        
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
