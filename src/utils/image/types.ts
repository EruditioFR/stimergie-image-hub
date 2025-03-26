
export interface Image {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  author?: string;
  tags?: string[];
  orientation?: string;
  // Additional properties for URL handling
  download_url?: string;
  url_miniature?: string;
  url?: string;
}
