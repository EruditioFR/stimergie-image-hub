
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

import { formSchema, FormValues, UserRole } from "./form/UserFormValidation";
import { UserFormProps } from "./form/UserFormTypes";
import { NameFields, EmailField } from "./form/fields/BasicInfoFields";
import { RoleField } from "./form/fields/RoleField";
import { ClientField } from "./form/fields/ClientField";
import { PasswordField } from "./form/fields/PasswordField";
import { UserFormActions } from "./form/UserFormActions";
import { UserFormHeader } from "./form/UserFormHeader";

export function UserForm({ clients, onSubmit, onCancel, initialData, isEditing = false, isAdmin = false }: UserFormProps) {
  // Type assertion to ensure role is of the correct type
  const userRole = initialData?.role as UserRole | undefined;
  
  const form = useForm<FormValues>({
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
    { value: "user" as UserRole, label: "Utilisateur" },
    { value: "admin_client" as UserRole, label: "Admin Client" },
  ];

  // Only show admin role if user is an admin
  if (isAdmin) {
    availableRoles.push({ value: "admin" as UserRole, label: "Administrateur" });
  }

  // Handle submit with proper handling for edit vs create
  const handleSubmit = (values: FormValues) => {
    if (isEditing && initialData) {
      // For editing, pass the full user with ID
      onSubmit({
        id: initialData.id,
        email: values.email,
        first_name: values.first_name,
        last_name: values.last_name,
        role: values.role,
        id_client: values.id_client === "" ? null : values.id_client,
      }, values.password); // Pass password even when editing
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
      <UserFormHeader isEditing={isEditing} onCancel={onCancel} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NameFields form={form} />
            <EmailField form={form} isEditing={isEditing} />
            <RoleField form={form} availableRoles={availableRoles} />
            <ClientField form={form} clients={clients} />
            <PasswordField form={form} isEditing={isEditing} />
          </div>

          <UserFormActions onCancel={onCancel} isEditing={isEditing} />
        </form>
      </Form>
    </div>
  );
}
