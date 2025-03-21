
import React from 'react';
import { CreateAlbumDialog } from '@/components/gallery/album/CreateAlbumDialog';

interface MasonryDetailModalProps {
  image: any;
  isOpen: boolean;
  onClose: () => void;
  isShareDialogOpen: boolean;
  setIsShareDialogOpen: (isOpen: boolean) => void;
  selectedImages: string[];
  images: any[];
}

export function MasonryDetailModal({
  isShareDialogOpen,
  setIsShareDialogOpen,
  selectedImages,
  images
}: MasonryDetailModalProps) {
  return (
    <CreateAlbumDialog 
      isOpen={isShareDialogOpen}
      onOpenChange={setIsShareDialogOpen}
      selectedImageIds={selectedImages}
      selectedImages={images}
    />
  );
}
