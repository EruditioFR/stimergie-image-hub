
import React from 'react';
import { Image } from '@/utils/image/types';
import { SelectionInfo } from './SelectionInfo';
import { ImageToolbarActions } from './ImageToolbarActions';
import { ToolbarContainer } from './ToolbarContainer';
import { useAuth } from '@/context/AuthContext';
import { useImageDownloader } from '@/hooks/downloads/useImageDownloader';
import { toast } from 'sonner';

interface MasonryToolbarContentProps {
  selectedImages: string[];
  clearSelection: () => void;
  onShareDialogChange: (isOpen: boolean) => void;
  images: Image[];
}

export function MasonryToolbarContent({
  selectedImages,
  clearSelection,
  onShareDialogChange,
  images
}: MasonryToolbarContentProps) {
  const { user } = useAuth();
  const { 
    isDownloadingSD, 
    isDownloadingHD, 
    downloadStandard, 
    downloadHD 
  } = useImageDownloader({ user, images });

  const openShareDialog = () => {
    if (selectedImages.length === 0) {
      toast.error("Veuillez sélectionner au moins une image");
      return;
    }
    
    onShareDialogChange(true);
  };

  return (
    <ToolbarContainer>
      <SelectionInfo count={selectedImages.length} onClear={clearSelection} />
      
      <ImageToolbarActions
        isDownloadingSD={isDownloadingSD}
        isDownloadingHD={isDownloadingHD}
        onDownloadSD={() => downloadStandard(selectedImages)}
        onDownloadHD={() => downloadHD(selectedImages)}
        onShare={openShareDialog}
        selectedCount={selectedImages.length}
      />
    </ToolbarContainer>
  );
}
