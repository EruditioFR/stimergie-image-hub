
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { RoleFieldProps } from "../UserFormTypes";

export function RoleField({ form, availableRoles }: RoleFieldProps) {
  return (
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
  );
}
