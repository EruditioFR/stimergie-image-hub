import { Button } from '@/components/ui/button';
import { Trash2, Bug } from 'lucide-react';
import { CacheDebugPanel } from '@/components/admin/CacheDebugPanel';
interface GalleryDebugControlsProps {
  isAdmin: boolean;
  isFlushing: boolean;
  selectedProject: string | null;
  showDebugPanel: boolean;
  onSmartFlushCache: () => void;
  onForceRefreshProject: () => void;
  onToggleDebugPanel: () => void;
}
export const GalleryDebugControls = ({
  isAdmin,
  isFlushing,
  selectedProject,
  showDebugPanel,
  onSmartFlushCache,
  onForceRefreshProject,
  onToggleDebugPanel
}: GalleryDebugControlsProps) => {
  if (!isAdmin) return null;
  return <>
      <div className="flex gap-2">
        
        
        {selectedProject && <Button variant="outline" size="sm" disabled={isFlushing} onClick={onForceRefreshProject} className="flex items-center gap-1">
            <Trash2 className="h-4 w-4" /> 
            {isFlushing ? 'Actualisation...' : 'Actualiser Projet'}
          </Button>}
        
        
      </div>

      {showDebugPanel && <div className="px-4 mb-6">
          <CacheDebugPanel />
        </div>}
    </>;
};