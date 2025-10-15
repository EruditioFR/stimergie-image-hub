
export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
  clientId: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Database field mappings for backward compatibility
  first_name?: string | null;
  last_name?: string | null;
  id_client?: string | null;
  client_ids?: string[] | null;
  client_name?: string | null;
}

// This interface matches the database structure for clients
export interface ClientDB {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  logo: string;
  contact_principal: string;
  created_at: string;
  updated_at: string;
}

// Type alias for compatibility with existing code
export type Client = ClientDB;
