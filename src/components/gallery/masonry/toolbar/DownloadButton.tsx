
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
      size="sm"
      className={`h-8 text-xs px-3 ${className}`}
    >
      {isLoading ? (
        <LoadingSpinner size={16} />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      <span className="hidden md:inline ml-1.5">{label}</span>
      <span className="md:hidden ml-1.5">{mobileLabel}</span>
      {sizeHint && <span className="hidden lg:inline text-[10px] opacity-70 ml-1">
        {sizeHint}
      </span>}
    </Button>
  );
}
