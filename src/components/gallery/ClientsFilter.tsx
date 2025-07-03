
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
import { toast } from 'sonner';
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
  const isRegularUser = userRole === 'user';
  const isAdminClient = userRole === 'admin_client';
  
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        console.log("Loading clients for ClientsFilter");
        
        const clientsData = await fetchClients();
        
        // Si c'est un utilisateur régulier, filtrer pour n'afficher que leur client
        if (isRegularUser && userClientId) {
          const filteredClients = clientsData.filter(client => client.id === userClientId);
          setClients(filteredClients);
          
          // Auto-sélectionner le client
          if (filteredClients.length === 1 && selectedClient !== userClientId) {
            onClientChange(userClientId);
          }
        } else if (isAdminClient && userClientId) {
          const filteredClients = clientsData.filter(client => client.id === userClientId);
          setClients(filteredClients);
          
          // Auto-sélectionner le client
          if (filteredClients.length === 1 && selectedClient !== userClientId) {
            onClientChange(userClientId);
          }
        } else {
          setClients(clientsData);
        }
      } catch (error) {
        console.error('Error loading clients:', error);
        toast("Impossible de charger la liste des clients", {
          description: "Une erreur est survenue lors du chargement des clients"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClients();
  }, [userRole, userClientId, user, onClientChange, isRegularUser, isAdminClient, selectedClient]);
  
  const handleValueChange = (value: string) => {
    // Ne pas autoriser les utilisateurs réguliers à changer leur client
    if (isRegularUser) {
      console.log("Users with role 'user' cannot change their client filter");
      return;
    }
    
    // Déclencher immédiatement le changement de client pour optimiser le chargement
    console.log(`Client filter changed to: ${value}`);
    onClientChange(value === 'all' ? null : value);
  };
  
  // Si aucun client n'est disponible et que nous ne sommes pas en train de charger, ne pas afficher le filtre
  if (clients.length === 0 && !isLoading) {
    return null;
  }
  
  return (
    <div className={className}>
      <Select 
        value={selectedClient || 'all'} 
        onValueChange={handleValueChange}
        disabled={isLoading || isRegularUser}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrer par client" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {!isRegularUser && <SelectItem value="all">Tous les clients</SelectItem>}
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
