
import React from 'react';
import { Button } from '@/components/ui/button';
import { Share } from 'lucide-react';

interface ShareButtonProps {
  onClick: () => void;
}

export function ShareButton({ onClick }: ShareButtonProps) {
  return (
    <Button 
      variant="default" 
      size="sm" 
      onClick={onClick}
      className="flex items-center gap-2 py-4"
    >
      <Share className="h-4 w-4" /> Partager
    </Button>
  );
}
