
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { User, Client } from "@/pages/Users";
import { X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

interface UserFormProps {
  clients: Client[];
  onSubmit: (user: Omit<User, 'id'> | User, password?: string) => void;
  onCancel: () => void;
  initialData?: User;
  isEditing?: boolean;
  isAdmin?: boolean;
}

// Define the role type to match the zod schema
type UserRole = "admin" | "admin_client" | "user";

// Schéma de validation pour le formulaire
const formSchema = z.object({
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

export function UserForm({ clients, onSubmit, onCancel, initialData, isEditing = false, isAdmin = false }: UserFormProps) {
  // Type assertion to ensure role is of the correct type
  const userRole = initialData?.role as UserRole | undefined;
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      email: initialData.email,
      first_name: initialData.first_name || "",
      last_name: initialData.last_name || "",
      role: userRole || "user",
      id_client: initialData.id_client || "",
      password: "",
    } : {
      email: "",
      first_name: "",
      last_name: "",
      role: "user" as UserRole,
      id_client: "",
      password: "",
    },
  });

  // Filter available roles based on user permissions
  const availableRoles = [
    { value: "user", label: "Utilisateur" },
    { value: "admin_client", label: "Admin Client" },
  ];

  // Only show admin role if user is an admin
  if (isAdmin) {
    availableRoles.push({ value: "admin", label: "Administrateur" });
  }

  // Handle submit with proper handling for edit vs create
  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (isEditing && initialData) {
      // For editing, pass the full user with ID
      onSubmit({
        id: initialData.id,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        id_client: values.id_client === "" ? null : values.id_client,
      });
    } else {
      // For new user, pass without ID and include password
      onSubmit({
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        id_client: values.id_client === "" ? null : values.id_client,
      }, values.password);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isEditing ? "Modifier l'utilisateur" : "Ajouter un nouvel utilisateur"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Jean" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Dupont" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="jean.dupont@example.com" 
                      {...field} 
                      disabled={isEditing} // Email shouldn't be changed when editing
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rôle *</FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      {...field}
                    >
                      {availableRoles.map(role => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="id_client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                      {...field}
                    >
                      <option value="">Aucun client</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.nom}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEditing && (
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe *</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Mot de passe" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Annuler
            </Button>
            <Button type="submit">
              {isEditing ? "Mettre à jour" : "Enregistrer"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
