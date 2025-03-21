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
