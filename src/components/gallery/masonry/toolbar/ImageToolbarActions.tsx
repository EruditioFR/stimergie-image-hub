
import React from 'react';
import { DownloadButton } from './DownloadButton';
import { ShareButton } from './ShareButton';

interface ImageToolbarActionsProps {
  isDownloadingSD: boolean;
  isDownloadingHD: boolean;
  onDownloadSD: () => void;
  onDownloadHD: () => void;
  onShare: () => void;
}

export function ImageToolbarActions({
  isDownloadingSD,
  isDownloadingHD,
  onDownloadSD,
  onDownloadHD,
  onShare
}: ImageToolbarActionsProps) {
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
        label="Version HD impression"
        sizeHint="(JPG, > 20 Mo)"
        mobileLabel="HD"
      />
      <ShareButton onClick={onShare} />
    </div>
  );
}
