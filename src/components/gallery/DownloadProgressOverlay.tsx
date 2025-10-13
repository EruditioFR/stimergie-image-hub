import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DownloadProgressOverlayProps {
  progress: number; // 0-100
  isComplete?: boolean;
}

export const DownloadProgressOverlay = ({ 
  progress, 
  isComplete 
}: DownloadProgressOverlayProps) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Fond semi-transparent */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      {/* Barre de progression (remplissage du bas vers le haut) */}
      <div 
        className={cn(
          "absolute bottom-0 left-0 right-0 transition-all duration-300 ease-out",
          "bg-gradient-to-t from-primary/80 to-primary/60"
        )}
        style={{ height: `${progress}%` }}
      />
      
      {/* Pourcentage affiché au centre */}
      {!isComplete && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-background/95 rounded-full px-6 py-3 shadow-lg border border-border">
            <span className="text-2xl font-bold text-foreground tabular-nums">
              {Math.round(progress)}%
            </span>
          </div>
        </div>
      )}
      
      {/* Icône de succès quand terminé */}
      {isComplete && (
        <div className="absolute inset-0 flex items-center justify-center animate-scale-in">
          <div className="bg-green-500 rounded-full p-4 shadow-lg">
            <Check className="h-10 w-10 text-white stroke-[3]" />
          </div>
        </div>
      )}
    </div>
  );
};
