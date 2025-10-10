
import React from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ImageContent } from './ImageContent';

interface DetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  image: any;
  imageDimensions: { width: number; height: number };
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export const DetailSheet = ({ 
  isOpen, 
  onClose, 
  image, 
  imageDimensions,
  onImageLoad
}: DetailSheetProps) => {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="h-screen p-0 max-w-none w-full sm:w-[85%] md:w-[75%] lg:w-[60%] xl:w-[50%]">
        <div className="h-full overflow-y-auto p-6 relative">
          <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose}
              aria-label="Fermer le détail de l'image"
              className="text-foreground border-0 hover:border-0 focus:border-0 active:border-0 ring-0 hover:ring-0 focus:ring-0 outline-none focus:outline-none"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="max-w-6xl mx-auto pt-8">
            <ImageContent 
              image={image} 
              imageDimensions={imageDimensions} 
              isFullPage={true}
              onImageLoad={onImageLoad}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
