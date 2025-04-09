
import { useState, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from '@/context/AuthContext';
import { toast } from '@/hooks/use-toast';
import { fetchClients } from '@/services/clientService';
import { Client } from '@/types/user';

interface ClientsFilterProps {
  selectedClient: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
  userRole?: string;
  userClientId?: string | null;
}

export function ClientsFilter({ selectedClient, onClientChange, className, userRole, userClientId }: ClientsFilterProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const isAdminClient = userRole === 'admin_client';
  
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        console.log("Loading clients for ClientsFilter");
        
        const clientsData = await fetchClients();
        
        // If admin_client, filter to only show their client
        if (isAdminClient && userClientId) {
          const filteredClients = clientsData.filter(client => client.id === userClientId);
          setClients(filteredClients);
          
          // Auto-select the client
          if (filteredClients.length === 1 && selectedClient !== userClientId) {
            onClientChange(userClientId);
          }
        } else {
          setClients(clientsData);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger la liste des clients"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClients();
  }, [userRole, userClientId, user, onClientChange, isAdminClient, selectedClient]);
  
  const handleValueChange = (value: string) => {
    // Don't allow admin_client users to change their client
    if (isAdminClient) {
      console.log("Admin client users cannot change their client filter");
      return;
    }
    
    // Immediately trigger client change to optimize loading
    console.log(`Client filter changed to: ${value}`);
    onClientChange(value === 'all' ? null : value);
  };
  
  // If no clients are available and we're not loading, don't show the filter
  if (clients.length === 0 && !isLoading) {
    return null;
  }
  
  return (
    <div className={className}>
      <Select 
        value={selectedClient || 'all'} 
        onValueChange={handleValueChange}
        disabled={isLoading || isAdminClient}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrer par client" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {!isAdminClient && <SelectItem value="all">Tous les clients</SelectItem>}
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
