
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
      className={`h-7 text-[10px] px-2 ${className}`}
    >
      {isLoading ? (
        <LoadingSpinner size={14} />
      ) : (
        <Download className="h-3 w-3" />
      )}
      <span className="hidden md:inline ml-1">{label}</span>
      <span className="md:hidden ml-1">{mobileLabel}</span>
      {sizeHint && <span className="hidden lg:inline text-[9px] opacity-70 ml-0.5">
        {sizeHint}
      </span>}
    </Button>
  );
}
