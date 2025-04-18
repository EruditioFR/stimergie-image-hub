
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DownloadButtonProps {
  isLoading: boolean;
  onClick: () => void;
  label: string;
  sizeHint?: string;
  mobileLabel?: string;
  disabled?: boolean;
}

export function DownloadButton({ 
  isLoading, 
  onClick, 
  label, 
  sizeHint,
  mobileLabel = "Télécharger",
  disabled = false
}: DownloadButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      onClick={onClick}
      disabled={isLoading || disabled}
      className="flex items-center gap-2 py-4"
    >
      {isLoading ? (
        <>
          <LoadingSpinner size={16} className="mr-1" /> 
          <span className="text-xs">Préparation...</span>
        </>
      ) : (
        <>
          <Download className="h-4 w-4" />
          <div className="hidden md:flex flex-col items-center">
            <span>{label}</span>
            {sizeHint && <span className="text-xs text-muted-foreground">{sizeHint}</span>}
          </div>
          <span className="md:hidden">{mobileLabel}</span>
        </>
      )}
    </Button>
  );
}
