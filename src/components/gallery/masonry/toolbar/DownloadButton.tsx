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
  return;
}