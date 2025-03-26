
import { CSSProperties, ReactNode } from 'react';

export interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  objectFit?: string;
  priority?: boolean;
  style?: CSSProperties;
  placeholder?: string | ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  width?: number;
  height?: number;
  loadingStrategy?: 'eager' | 'lazy' | 'auto';
  showProgress?: boolean;
  fallbackSrc?: string;
}

export type LoadingState = 'loading' | 'loaded' | 'error';
