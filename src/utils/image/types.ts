
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
  // Add the SD download URL
  download_url_sd: string;
  // For backwards compatibility
  url_miniature?: string;
  url?: string;
  // Project information
  projets?: {
    nom_projet?: string;
    nom_dossier?: string;
    clients?: {
      id?: string;
      nom?: string;
    };
  };
  id_projet?: string;
  // Shared clients information
  image_shared_clients?: Array<{
    client_id: string;
    clients?: {
      id?: string;
      nom?: string;
    };
  }>;
}
