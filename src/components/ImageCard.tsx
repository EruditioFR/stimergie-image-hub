
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
}

export function ImageCard({ id, src, alt, title, author, className, orientation }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  // Get appropriate aspect ratio based on image orientation
  const getAspectRatio = () => {
    switch (orientation?.toLowerCase()) {
      case 'landscape':
        return 'aspect-[4/3]';
      case 'portrait':
        return 'aspect-[3/4]';
      case 'square':
        return 'aspect-square';
      default:
        return 'aspect-auto'; // Default to auto if orientation is unknown
    }
  };

  return (
    <div 
      className={cn(
        "image-card group rounded-xl overflow-hidden bg-card",
        "transition-all duration-300 ease-in-out",
        "shadow-sm hover:shadow-xl",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link to={`/image/${id}`} className="block relative">
        <LazyImage 
          src={src} 
          alt={alt} 
          className={`w-full ${getAspectRatio()}`}
          objectFit="object-cover" 
        />
        
        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent",
          "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          "flex flex-col justify-end p-4"
        )}>
          <h3 className="text-white font-medium truncate">{title}</h3>
          <p className="text-white/80 text-sm">Par {author}</p>
        </div>
      </Link>
      
      {/* Download button */}
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
            // Download logic would go here
            window.open(src, '_blank');
          }}
        >
          <Download className="h-4 w-4 text-foreground" />
          <span className="sr-only">Télécharger</span>
        </Button>
      </div>
    </div>
  );
}

export default ImageCard;
