
import React from 'react';
import { DownloadButton } from './DownloadButton';
import { ShareButton } from './ShareButton';

// Constants for download thresholds
const SD_SERVER_THRESHOLD = 10;  // Use server-side for 10+ images in SD mode
const HD_SERVER_THRESHOLD = 3;   // Use server-side for 3+ images in HD mode

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
  const hdButtonLabel = selectedCount >= HD_SERVER_THRESHOLD
    ? "Ajouter à mes téléchargements HD"
    : "Version HD impression";
    
  const hdButtonHint = selectedCount >= HD_SERVER_THRESHOLD
    ? "(Accessibles via la page Téléchargements)"
    : "(JPG, > 20 Mo)";
    
  const hdButtonMobileLabel = selectedCount >= HD_SERVER_THRESHOLD ? "Téléchargements HD" : "HD";

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
        className={selectedCount >= HD_SERVER_THRESHOLD ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200" : ""}
      />
      <ShareButton onClick={onShare} />
    </div>
  );
}
