
import React from 'react';
import { Image } from '@/utils/image/types';
import { MasonryToolbarContent } from './toolbar/MasonryToolbarContent';

interface MasonryToolbarProps {
  selectedImages: string[];
  clearSelection: () => void;
  onShareDialogChange: (isOpen: boolean) => void;
  images: Image[];
}

export function MasonryToolbar(props: MasonryToolbarProps) {
  if (props.selectedImages.length === 0) return null;
  
  return <MasonryToolbarContent {...props} />;
}
