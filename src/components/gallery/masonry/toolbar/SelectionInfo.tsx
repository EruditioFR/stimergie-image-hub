
import React from 'react';
import { Button } from '@/components/ui/button';

interface SelectionInfoProps {
  count: number;
  onClear: () => void;
}

export function SelectionInfo({ count, onClear }: SelectionInfoProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium">{count} image{count > 1 ? 's' : ''}</span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClear}
        className="h-7 px-2 text-xs"
      >
        Tout désélectionner
      </Button>
    </div>
  );
}
