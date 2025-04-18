
import { useEffect } from "react";
import { 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { fetchClients } from "@/services/clientService";
import { useQuery } from "@tanstack/react-query";
import { UserFormFieldProps } from "../UserFormTypes";

export const ClientField = ({ form, disabled = false }: UserFormFieldProps) => {
  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  // When the user selects "none", set the actual value to null
  const handleValueChange = (value: string) => {
    form.setValue("id_client", value === "none" ? "" : value);
  };

  return (
    <FormField
      control={form.control}
      name="id_client"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Client</FormLabel>
          <Select 
            disabled={disabled || isLoading} 
            onValueChange={handleValueChange} 
            value={field.value === "" ? "none" : field.value}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="none">Aucun client</SelectItem>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
