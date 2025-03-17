
import * as z from "zod";

// Define the role type to match the zod schema
export type UserRole = "admin" | "admin_client" | "user";

// Create a base schema without password
const baseSchema = {
  email: z.string().email("L'adresse email est invalide"),
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  role: z.enum(["admin", "admin_client", "user"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  id_client: z.string().optional(),
};

// Schema for creating a new user (password required)
export const createUserSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

// Schema for updating an existing user (password optional)
export const updateUserSchema = z.object({
  ...baseSchema,
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional()
    .or(z.literal('')),
});

// Default schema for backward compatibility
export const formSchema = updateUserSchema;

export type FormValues = z.infer<typeof formSchema>;
