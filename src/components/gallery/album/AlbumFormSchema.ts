
import * as z from 'zod';

// Définition du schéma de validation
export const albumFormSchema = z.object({
  name: z.string().min(3, { message: 'Le nom doit contenir au moins 3 caractères' }),
  description: z.string().optional(),
  emails: z.string().min(5, { message: 'Veuillez entrer au moins une adresse email valide' }),
  message: z.string().optional(),
  accessFrom: z.date({ required_error: 'Veuillez sélectionner une date de début' }),
  accessUntil: z.date({ required_error: 'Veuillez sélectionner une date de fin' }),
}).refine(data => data.accessUntil > data.accessFrom, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["accessUntil"],
});

export type AlbumFormValues = z.infer<typeof albumFormSchema>;
