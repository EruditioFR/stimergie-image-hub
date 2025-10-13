import { Progress } from '@/components/ui/progress';

interface BulkDownloadProgressProps {
  current: number;
  total: number;
  currentFile: string;
}

export const BulkDownloadProgress = ({ 
  current, 
  total, 
  currentFile 
}: BulkDownloadProgressProps) => {
  const percentage = Math.round((current / total) * 100);
  
  return (
    <div className="fixed bottom-4 right-4 bg-card border border-border rounded-lg shadow-xl p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-foreground">Téléchargement HD</span>
        <span className="text-sm text-muted-foreground tabular-nums">{percentage}%</span>
      </div>
      
      <Progress value={percentage} className="mb-3" />
      
      <div className="text-sm text-foreground font-medium mb-1">
        {current} / {total} images
      </div>
      <div className="text-xs text-muted-foreground truncate" title={currentFile}>
        {currentFile}
      </div>
    </div>
  );
};
