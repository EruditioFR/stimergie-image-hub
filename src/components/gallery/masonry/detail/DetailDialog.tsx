
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface DetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  image: any;
  imageDimensions: { width: number; height: number };
  modalClass: string;
  modalWidth: string;
  onImageLoad: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export function DetailDialog({
  isOpen,
  onClose,
  image,
  imageDimensions,
  modalClass,
  modalWidth,
  onImageLoad
}: DetailDialogProps) {
  if (!image) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-0 overflow-hidden" style={{ width: modalWidth }}>
        {/* Ajout du DialogTitle pour l'accessibilité */}
        <VisuallyHidden>
          <h2 id="dialog-title">{image.title || 'Détail de l\'image'}</h2>
        </VisuallyHidden>
        
        <ScrollArea className="max-h-[90vh]">
          <div className={`image-detail-dialog ${modalClass}`}>
            <div className="relative">
              <img 
                src={image.display_url || image.url}
                alt={image.title || 'Image détaillée'}
                className="max-w-full mx-auto"
                style={{ maxHeight: '70vh' }}
                onLoad={onImageLoad}
              />
            </div>
            
            <div className="p-6">
              <h3 className="text-xl font-semibold mb-2">{image.title}</h3>
              {image.description && (
                <p className="text-muted-foreground mb-4">{image.description}</p>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
