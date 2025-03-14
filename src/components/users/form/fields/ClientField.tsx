
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ClientFieldProps } from "../UserFormTypes";

export function ClientField({ form, clients }: ClientFieldProps) {
  return (
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
  );
}
