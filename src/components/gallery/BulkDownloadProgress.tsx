import { Progress } from '@/components/ui/progress';
import { formatTime } from '@/utils/timeFormatting';

interface BulkDownloadProgressProps {
  current: number;
  total: number;
  currentFile: string;
  startTime: number;
  isActive: boolean;
}

export const BulkDownloadProgress = ({ 
  current, 
  total, 
  currentFile,
  startTime,
  isActive
}: BulkDownloadProgressProps) => {
  if (!isActive) return null;
  
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const elapsed = (Date.now() - startTime) / 1000; // seconds
  const speed = current > 0 && elapsed > 0 ? current / elapsed : 0;
  const remaining = current > 0 && speed > 0 ? (total - current) / speed : 0;
  
  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-xl p-4 w-80 z-50 animate-scale-in">
      {/* Header with percentage */}
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">Téléchargement HD</span>
        <span className="text-lg font-bold text-primary tabular-nums">{percentage}%</span>
      </div>
      
      {/* Progress bar */}
      <Progress value={percentage} className="mb-3 h-2" />
      
      {/* Image count and ETA */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-foreground">
          {current} / {total} images
        </span>
        <span className="text-xs text-muted-foreground">
          {remaining > 0 ? `~${formatTime(remaining)}` : 'Calcul...'}
        </span>
      </div>
      
      {/* Current file */}
      <div className="text-xs text-muted-foreground truncate mb-1" title={currentFile}>
        📥 {currentFile}
      </div>
      
      {/* Speed indicator */}
      <div className="text-xs text-muted-foreground">
        {speed > 0 ? `${speed.toFixed(1)} img/s` : 'Démarrage...'}
      </div>
    </div>
  );
};
