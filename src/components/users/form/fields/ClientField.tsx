
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { ClientFieldProps } from "../UserFormTypes";
import { useEffect, useState } from "react";
import { Client } from "@/types/user";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/hooks/use-toast";

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
        
        let query = supabase
          .from('clients')
          .select('id, nom')
          .order('nom', { ascending: true });
        
        // Si c'est un admin_client, on filtre pour n'afficher que son propre client
        if (userRole === 'admin_client' && user) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id_client')
            .eq('id', user.id)
            .single();
            
          if (profileError) {
            console.error('Error loading user profile:', profileError);
            return;
          }
          
          if (profileData?.id_client) {
            query = query.eq('id', profileData.id_client);
          }
        }
        
        const { data, error } = await query;
        
        if (error) {
          console.error('Error loading clients:', error);
          toast({
            variant: "destructive",
            title: "Erreur",
            description: "Impossible de charger la liste des clients"
          });
          return;
        }
        
        console.log(`Retrieved ${data?.length || 0} clients for ClientField`);
        setClients(data || []);
        
        // Si admin_client user, auto-select son client
        if (userRole === 'admin_client' && data && data.length === 1) {
          form.setValue('id_client', data[0].id);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des clients"
        });
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
