
export interface Image {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  author?: string;
  tags?: string[];
  orientation?: string;
  width?: number;
  height?: number;
  created_at?: string;
  description?: string;
  // These URLs are used for display and download
  display_url: string;  // Now required
  download_url: string; // Now required
  // For backwards compatibility
  url_miniature?: string;
  url?: string;
}
