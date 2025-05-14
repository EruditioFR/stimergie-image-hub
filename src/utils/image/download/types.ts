export interface ImageForZip {
  /** URL de l'image */
  url: string;
  /** Titre de l'image */
  title: string;
  /** ID de l'image (peut être un string ou un number selon la source) */
  id: string | number;
}

export interface DownloadResult {
  image: ImageForZip;
  blob: Blob;
}
