
import React from 'react';
import { LazyImage } from './LazyImage';
import { LazyImageProps } from './types';

export const LazyImageWithPriority: React.FC<LazyImageProps> = (props) => {
  return (
    <LazyImage 
      {...props} 
      priority={true} 
      loadingStrategy="eager"
    />
  );
};
