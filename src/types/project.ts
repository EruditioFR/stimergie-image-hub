
export interface Client {
  id: number;
  name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface Project {
  id?: string;  // Made optional for new project creation
  title?: string;                // English version
  nom_projet: string;            // French version
  description?: string;
  type_projet?: string;
  id_client: string;
  status?: string;
  client_name?: string;
  client_logo?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  cover_image?: string;
  is_public?: boolean;
  nom_dossier?: string;
}

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  status: string;
  id_client?: number;
  created_at: string;
  updated_at: string;
}
