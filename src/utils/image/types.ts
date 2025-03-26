
export interface Image {
  id: string;
  src: string;
  alt?: string;
  title?: string;
  author?: string;
  tags?: string[];
  orientation?: string;
  // Ces URLs sont utilisées pour l'affichage et le téléchargement
  display_url?: string;
  download_url?: string;
  // Pour rétrocompatibilité
  url_miniature?: string;
  url?: string;
}
