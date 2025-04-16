
export interface ImageForZip {
  url: string;
  title: string;
  id: string | number;
}

export interface DownloadResult {
  image: ImageForZip;
  blob: Blob;
}

