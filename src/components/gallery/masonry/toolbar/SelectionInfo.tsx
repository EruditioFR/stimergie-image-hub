
import React from 'react';
import { Button } from '@/components/ui/button';

interface SelectionInfoProps {
  count: number;
  onClear: () => void;
}

export function SelectionInfo({ count, onClear }: SelectionInfoProps) {
  return (
    <div>
      <span className="font-medium">{count} image{count > 1 ? 's' : ''} sélectionnée{count > 1 ? 's' : ''}</span>
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={onClear}
        className="ml-2 py-4"
      >
        Désélectionner tout
      </Button>
    </div>
  );
}
