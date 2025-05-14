
export interface ImageForZip {
  url: string;
  title: string;
  id: string | number;  // Accepte désormais les deux types pour plus de flexibilité
}

export interface DownloadResult {
  image: ImageForZip;
  blob: Blob;
}
