
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
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">{image.title}</h3>
                  {image.description && (
                    <p className="text-muted-foreground">{image.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <button 
                    onClick={() => window.open(image?.display_url || image?.url || '', '_blank')}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded hover:bg-primary/90 transition-colors"
                  >
                    SD (Web)
                  </button>
                  <button 
                    onClick={() => window.open(image?.download_url || image?.url || '', '_blank')}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    HD (Impression)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
