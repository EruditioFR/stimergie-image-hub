
import { z } from "zod";

// Définition des rôles utilisateur
export type UserRole = "user" | "admin" | "admin_client";

// Schéma de validation pour la création d'un utilisateur
export const createUserSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide")
    .min(1, "L'email est requis"),
  first_name: z
    .string()
    .min(1, "Le prénom est requis"),
  last_name: z
    .string()
    .min(1, "Le nom est requis"),
  password: z
    .string()
    .min(6, "Le mot de passe doit contenir au moins 6 caractères")
    .max(100),
  role: z.enum(["user", "admin", "admin_client"] as const).default("user"),
  clientIds: z.array(z.string()).default([]),
});

// Schéma de validation pour la mise à jour d'un utilisateur
export const updateUserSchema = z.object({
  email: z
    .string()
    .email("Adresse email invalide")
    .min(1, "L'email est requis"),
  first_name: z
    .string()
    .min(1, "Le prénom est requis"),
  last_name: z
    .string()
    .min(1, "Le nom est requis"),
  password: z
    .string()
    .max(100)
    .optional(),
  role: z.enum(["user", "admin", "admin_client"] as const),
  clientIds: z.array(z.string()).default([]),
});

// Type pour les valeurs du formulaire
export type FormValues = z.infer<typeof createUserSchema>;
