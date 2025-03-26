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
  downloadUrl?: string;
}

export const ImageCard = memo(function ImageCard({ 
  id, src, alt, title, author, className, orientation, onClick, downloadUrl 
}: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const mountedRef = useRef(true);
  
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
  
  const isPriority = parseInt(id) < 10 || parseInt(id) % 20 < 5;
  
  const fallbackSrc = 'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22800%22%20height%3D%22600%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%20800%20600%22%20preserveAspectRatio%3D%22none%22%3E%3Cdefs%3E%3Cstyle%20type%3D%22text%2Fcss%22%3E%23holder_15e8b29e358%20text%20%7B%20fill%3A%23AAA%3Bfont-weight%3Anormal%3Bfont-family%3AHelvetica%2C%20monospace%3Bfont-size%3A40pt%20%7D%20%3C%2Fstyle%3E%3C%2Fdefs%3E%3Cg%20id%3D%22holder_15e8b29e358%22%3E%3Crect%20width%3D%22800%22%20height%3D%22600%22%20fill%3D%22%23F5F5F5%22%3E%3C%2Frect%3E%3Cg%3E%3Ctext%20x%3D%22285%22%20y%3D%22320%22%3E%3C%2Ftext%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E';

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = downloadUrl || src;
    window.open(url, '_blank');
  };

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
            src={src}
            alt={alt} 
            className={`w-full ${getAspectRatio()}`}
            objectFit="object-cover"
            fallbackSrc={fallbackSrc}
            showProgress={false}
          />
        ) : (
          <LazyImage 
            src={src}
            alt={alt} 
            className={`w-full ${getAspectRatio()}`}
            objectFit="object-cover"
            fallbackSrc={fallbackSrc}
            showProgress={false}
          />
        )}
        
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex flex-col justify-end p-4"
        )}>
          <h3 className="text-white font-medium truncate">{title}</h3>
          <p className="text-white/80 text-sm">Par {author}</p>
        </div>
      </div>
      
      <div className={cn(
        "absolute top-3 right-3 transform",
        "transition-all duration-300 ease-in-out",
        isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      )}>
        <Button 
          size="icon" 
          variant="secondary" 
          className="bg-white/90 hover:bg-white w-8 h-8 rounded-full shadow-md"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4 text-foreground" />
          <span className="sr-only">Télécharger</span>
        </Button>
      </div>
    </div>
  );
});

export default ImageCard;
