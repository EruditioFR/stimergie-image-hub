
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ClientFieldProps } from "../UserFormTypes";
import { useEffect, useState } from "react";
import { Client } from "@/types/user";
import { useAuth } from "@/context/AuthContext";
import { fetchClients, getAdminClientId } from "@/services/clientService";

export function ClientField({ form, clients: initialClients }: ClientFieldProps) {
  const [clients, setClients] = useState<Client[]>(initialClients || []);
  const [loading, setLoading] = useState(false);
  const { userRole, user } = useAuth();

  useEffect(() => {
    // Si des clients ont été passés en props, on les utilise directement
    if (initialClients && initialClients.length > 0) {
      setClients(initialClients);
      return;
    }

    const loadClients = async () => {
      setLoading(true);
      try {
        console.log("Loading clients for ClientField, userRole:", userRole);
        
        const clientsData = await fetchClients(userRole, user?.id);
        setClients(clientsData);
        
        // Si admin_client user, auto-select son client
        if (userRole === 'admin_client' && clientsData.length === 1) {
          form.setValue('id_client', clientsData[0].id);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadClients();
  }, [userRole, user, form, initialClients]);

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
              value={field.value || ""}
              disabled={loading || (userRole === 'admin_client' && clients.length === 1)}
            >
              <option value="">Aucun client</option>
              {clients.map(client => (
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
