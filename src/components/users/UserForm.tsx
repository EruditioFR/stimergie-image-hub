
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
import { EmailField } from "./form/fields/BasicInfoFields";
import { PasswordField } from "./form/fields/PasswordField";
import { UserFormActions } from "./form/UserFormActions";
import { UserFormHeader } from "./form/UserFormHeader";

export function UserForm({ clients, onSubmit, onCancel, initialData, isEditing = false, isAdmin = false }: UserFormProps) {
  // Use the appropriate schema based on whether we're editing or creating
  const schema = isEditing ? updateUserSchema : createUserSchema;
  
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData ? {
      email: initialData.email,
      first_name: "",
      last_name: "",
      role: "user",
      id_client: "",
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

  // Handle submit with proper handling for edit vs create
  const handleSubmit = (values: FormValues) => {
    if (isEditing && initialData) {
      // For editing, pass the full user with ID
      onSubmit({
        id: initialData.id,
        email: values.email,
        first_name: "",
        last_name: "",
        role: "user",
        id_client: null,
      }, values.password); // Pass password even when editing
    } else {
      // For new user, pass without ID and include password
      onSubmit({
        email: values.email,
        first_name: "",
        last_name: "",
        role: "user",
        id_client: null,
      }, values.password);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <UserFormHeader isEditing={isEditing} onCancel={onCancel} />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <EmailField form={form} isEditing={isEditing} />
            <PasswordField form={form} isEditing={isEditing} />
          </div>

          <UserFormActions onCancel={onCancel} isEditing={isEditing} />
        </form>
      </Form>
    </div>
  );
}
