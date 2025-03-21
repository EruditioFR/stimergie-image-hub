
export type User = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: string;
  id_client: string | null;
  client_name?: string;
};

export type Client = {
  id: string;
  nom: string;
};

// Add a new interface to properly type the clients from the database
export interface ClientDB {
  id: string;
  nom: string;
  email?: string;
  telephone?: string;
  contact_principal?: string;
  logo?: string;
  created_at?: string;
  updated_at?: string;
}
