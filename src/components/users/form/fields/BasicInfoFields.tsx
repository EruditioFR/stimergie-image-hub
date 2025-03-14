
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UserFormFieldProps } from "../UserFormTypes";

export function NameFields({ form }: UserFormFieldProps) {
  return (
    <>
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
    </>
  );
}

export function EmailField({ form, isEditing }: UserFormFieldProps) {
  return (
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
  );
}
