
import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
  nom: string;
}

interface ClientsFilterProps {
  selectedClient: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
}

export function ClientsFilter({ selectedClient, onClientChange, className }: ClientsFilterProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userRole, user, isAdmin } = useAuth();
  
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        console.log("Loading clients for ClientsFilter, userRole:", userRole);
        
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
        
        console.log(`Retrieved ${data?.length || 0} clients for filter`);
        setClients(data || []);
        
        // Si admin_client user, auto-select son client
        if (userRole === 'admin_client' && data && data.length === 1) {
          onClientChange(data[0].id);
        }
      } catch (error) {
        console.error('Error:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Une erreur est survenue lors du chargement des clients"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClients();
  }, [userRole, user, onClientChange, isAdmin]);
  
  const handleValueChange = (value: string) => {
    onClientChange(value === 'all' ? null : value);
  };
  
  // Si aucun client n'est disponible et qu'on n'est pas en train de charger, on ne montre pas le filtre
  if (clients.length === 0 && !isLoading) {
    return null;
  }
  
  return (
    <div className={className}>
      <Select 
        value={selectedClient || 'all'} 
        onValueChange={handleValueChange}
        disabled={isLoading || (userRole === 'admin_client' && clients.length === 1)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrer par client" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {userRole === 'admin' && (
              <SelectItem value="all">Tous les clients</SelectItem>
            )}
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.nom}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
