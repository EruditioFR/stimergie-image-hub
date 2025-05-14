
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { User } from "@/types/user";
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

import { createUserSchema, updateUserSchema, FormValues, UserRole } from "./form/UserFormValidation";
import { UserFormProps } from "./form/UserFormTypes";
import { EmailField, NameFields } from "./form/fields/BasicInfoFields";
import { PasswordField } from "./form/fields/PasswordField";
import { UserFormActions } from "./form/UserFormActions";
import { UserFormHeader } from "./form/UserFormHeader";
import { RoleField } from "./form/fields/RoleField";
import { ClientField } from "./form/fields/ClientField";

export function UserForm({ clients, onSubmit, onCancel, initialData, isEditing = false, isAdmin = false }: UserFormProps) {
  // Use the appropriate schema based on whether we're editing or creating
  const schema = isEditing ? updateUserSchema : createUserSchema;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      email: initialData.email,
      first_name: initialData.firstName || initialData.first_name || "",
      last_name: initialData.lastName || initialData.last_name || "",
      role: initialData.role as UserRole,
      clientId: initialData.clientId || initialData.id_client || null,
      password: "",
    } : {
      email: "",
      first_name: "",
      last_name: "",
      role: "user" as UserRole,
      clientId: null,
      password: "",
    },
  });

  // Generate a random password for new users that admins can share with them
  const [generatedPassword, setGeneratedPassword] = useState<string>("");
  
  // Function to generate a random password
  const generateRandomPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(password);
    form.setValue("password", password);
  };

  // Available role options
  const availableRoles: Array<{value: UserRole, label: string}> = isAdmin ? [
    { value: "user", label: "Utilisateur" },
    { value: "admin_client", label: "Admin Client" },
    { value: "admin", label: "Administrateur" }
  ] : [
    { value: "user", label: "Utilisateur" },
    { value: "admin_client", label: "Admin Client" }
  ];

  // Handle submit with proper handling for edit vs create
  const handleSubmit = (values: FormValues) => {
    if (isEditing && initialData) {
      // For editing, pass the full user with ID
      onSubmit({
        id: initialData.id,
        email: values.email,
        firstName: values.first_name,
        lastName: values.last_name,
        fullName: `${values.first_name} ${values.last_name}`.trim(),
        avatarUrl: initialData.avatarUrl,
        role: values.role,
        clientId: values.clientId,
        createdAt: initialData.createdAt || "",
        updatedAt: new Date().toISOString(),
        // For backward compatibility
        first_name: values.first_name,
        last_name: values.last_name,
        id_client: values.clientId,
      }, values.password); // Pass password even when editing
    } else {
      // For new user, pass without ID and include password
      onSubmit({
        email: values.email,
        firstName: values.first_name,
        lastName: values.last_name,
        fullName: `${values.first_name} ${values.last_name}`.trim(),
        avatarUrl: null,
        role: values.role,
        clientId: values.clientId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // For backward compatibility
        first_name: values.first_name,
        last_name: values.last_name,
        id_client: values.clientId,
      }, values.password || generatedPassword); // Use generated password if field is empty
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <UserFormHeader isEditing={isEditing} onCancel={onCancel} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EmailField form={form} isEditing={isEditing} />
            <RoleField form={form} availableRoles={availableRoles} />
            <NameFields form={form} />
            <ClientField form={form} clients={clients} />
            <PasswordField form={form} isEditing={isEditing} />
            
            {!isEditing && (
              <div className="mt-2 md:col-span-2">
                <Button 
                  type="button" 
                  variant="outline"
                  className="text-sm"
                  onClick={generateRandomPassword}
                >
                  Générer un mot de passe
                </Button>
                
                {generatedPassword && (
                  <div className="mt-2 p-3 bg-gray-50 border rounded-md">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">Mot de passe généré:</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGeneratedPassword("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-1 font-mono text-sm break-all">{generatedPassword}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Conservez ce mot de passe en lieu sûr pour le communiquer à l'utilisateur.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <UserFormActions onCancel={onCancel} isEditing={isEditing} />
        </form>
      </Form>
    </div>
  );
}
