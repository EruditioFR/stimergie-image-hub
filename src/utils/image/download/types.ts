
export interface ImageForZip {
  id: string | number;  // Accepte à la fois des string et des number
  url: string;
  title: string;
}

export interface DownloadResult {
  image: ImageForZip;
  blob: Blob;
}

// Add the ImageDownloadFormat type definition here to match the one in singleImageDownloader.ts
export type ImageDownloadFormat = 'jpg' | 'png' | 'auto';
