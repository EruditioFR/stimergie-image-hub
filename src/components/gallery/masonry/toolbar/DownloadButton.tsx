
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
  className?: string;
}

export function DownloadButton({
  isLoading,
  onClick,
  label,
  sizeHint,
  mobileLabel = "Télécharger",
  disabled = false,
  className = ""
}: DownloadButtonProps) {
  return (
    <Button 
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`min-w-[140px] bg-primary text-white ${className}`}
    >
      {isLoading ? (
        <LoadingSpinner size={24} />
      ) : (
        <Download className="h-4 w-4 mr-1" />
      )}
      <span className="hidden md:inline">{label}</span>
      <span className="md:hidden">{mobileLabel}</span>
      {sizeHint && <span className="hidden md:inline text-xs opacity-75 ml-1">
        {sizeHint}
      </span>}
    </Button>
  );
}
