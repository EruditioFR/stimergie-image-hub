
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordFieldProps } from "../UserFormTypes";

export function PasswordField({ form, isEditing }: PasswordFieldProps) {
  return (
    <FormField
      control={form.control}
      name="password"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{isEditing ? "Nouveau mot de passe" : "Mot de passe *"}</FormLabel>
          <FormControl>
            <Input 
              type="password" 
              placeholder={isEditing ? "Laisser vide pour ne pas changer" : "Mot de passe"} 
              {...field} 
            />
          </FormControl>
          <FormMessage />
          {isEditing ? (
            <p className="text-xs text-muted-foreground">
              Ne remplissez ce champ que si vous souhaitez modifier le mot de passe.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Le mot de passe doit contenir au moins 6 caractères.
            </p>
          )}
        </FormItem>
      )}
    />
  );
}
