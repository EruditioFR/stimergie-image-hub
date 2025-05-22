
export interface ImageForZip {
  id: string | number;  // Accepte à la fois des string et des number
  url: string;
  title: string;
}

export interface DownloadResult {
  image: ImageForZip;
  blob: Blob;
}

// Define the ImageDownloadFormat type to match the one in singleImageDownloader.ts
export type ImageDownloadFormat = 'jpg' | 'png' | 'auto';
