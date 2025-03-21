
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
  const isNonAdmin = ['admin_client', 'user'].includes(userRole || '');
  
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        console.log("Loading clients for ClientsFilter");
        
        const clientsData = await fetchClients();
        
        // If admin_client or user, filter to only show their client
        if (isNonAdmin && userClientId) {
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
  }, [userRole, userClientId, user, onClientChange, isNonAdmin, selectedClient]);
  
  const handleValueChange = (value: string) => {
    // Don't allow non-admin users to change their client
    if (isNonAdmin) {
      console.log("Non-admin users cannot change their client");
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
        disabled={isLoading || isNonAdmin}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrer par client" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {!isNonAdmin && <SelectItem value="all">Tous les clients</SelectItem>}
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
