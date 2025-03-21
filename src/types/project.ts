
export interface Project {
  id?: string;  // Optional for new projects
  nom_projet: string;
  type_projet: string;
  id_client: string;
  nom_dossier: string;
  created_at?: string;
  updated_at?: string;
}
