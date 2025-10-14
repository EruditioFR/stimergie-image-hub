
import React from 'react';
import { Button } from '@/components/ui/button';

interface SelectionInfoProps {
  count: number;
  onClear: () => void;
}

export function SelectionInfo({ count, onClear }: SelectionInfoProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[11px] font-medium whitespace-nowrap">{count} img</span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClear}
        className="h-6 px-1.5 text-[10px]"
      >
        Effacer
      </Button>
    </div>
  );
}
