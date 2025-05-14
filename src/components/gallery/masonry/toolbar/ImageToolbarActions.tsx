
import React from 'react';
import { DownloadButton } from './DownloadButton';
import { ShareButton } from './ShareButton';

interface ImageToolbarActionsProps {
  isDownloadingSD: boolean;
  isDownloadingHD: boolean;
  onDownloadSD: () => void;
  onDownloadHD: () => void;
  onShare: () => void;
  selectedCount: number;
}

export function ImageToolbarActions({
  isDownloadingSD,
  isDownloadingHD,
  onDownloadSD,
  onDownloadHD,
  onShare,
  selectedCount
}: ImageToolbarActionsProps) {
  // Adapter les labels selon le nombre d'images sélectionnées
  const hdButtonLabel = selectedCount >= 3 
    ? "Ajouter à mes téléchargements HD"
    : "Version HD impression";
    
  const hdButtonHint = selectedCount >= 3
    ? "(Accessibles via la page Téléchargements)"
    : "(JPG, > 20 Mo)";
    
  const hdButtonMobileLabel = selectedCount >= 3 ? "Téléchargements HD" : "HD";

  return (
    <div className="flex flex-wrap gap-2">
      <DownloadButton 
        isLoading={isDownloadingSD}
        onClick={onDownloadSD}
        label="Version web & réseaux sociaux"
        sizeHint="(JPG, < 2 Mo)"
      />
      <DownloadButton 
        isLoading={isDownloadingHD}
        onClick={onDownloadHD}
        label={hdButtonLabel}
        sizeHint={hdButtonHint}
        mobileLabel={hdButtonMobileLabel}
        className={selectedCount >= 3 ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" : ""}
      />
      <ShareButton onClick={onShare} />
    </div>
  );
}
