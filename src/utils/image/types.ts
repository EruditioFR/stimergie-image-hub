
export interface Image {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  author?: string;
  tags?: string[] | null;
  orientation?: string;
  width?: number;
  height?: number;
  created_at?: string;
  description?: string;
  // These URLs are used for display and download - now required
  display_url: string;
  download_url: string;
  // For backwards compatibility
  url_miniature?: string;
  url?: string;
}
