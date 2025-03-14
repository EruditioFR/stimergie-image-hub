
import * as z from "zod";

// Define the role type to match the zod schema
export type UserRole = "admin" | "admin_client" | "user";

// Schéma de validation pour le formulaire
export const formSchema = z.object({
  email: z.string().email("L'adresse email est invalide"),
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  role: z.enum(["admin", "admin_client", "user"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
  id_client: z.string().optional(),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional()
    .or(z.literal('')),
});

export type FormValues = z.infer<typeof formSchema>;
