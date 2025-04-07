
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share } from 'lucide-react';

interface SelectionToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onDownload: () => void;
  onShare: () => void;
}

export function SelectionToolbar({
  selectedCount,
  onClearSelection,
  onDownload,
  onShare
}: SelectionToolbarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-20 z-10 bg-background/80 backdrop-blur-sm p-4 mb-4 rounded-lg border shadow-sm flex items-center justify-between">
      <div>
        <span className="font-medium">{selectedCount} image{selectedCount > 1 ? 's' : ''} sélectionnée{selectedCount > 1 ? 's' : ''}</span>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          className="ml-2 py-4"
        >
          Désélectionner tout
        </Button>
      </div>
      <div className="flex space-x-2">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onDownload}
          className="flex items-center gap-2 py-4"
        >
          <Download className="h-4 w-4" /> Télécharger ({selectedCount})
        </Button>
        <Button 
          variant="default" 
          size="sm" 
          onClick={onShare}
          className="flex items-center gap-2 py-4"
        >
          <Share className="h-4 w-4" /> Partager
        </Button>
      </div>
    </div>
  );
}
