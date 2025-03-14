
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
}

export function ClientsFilter({ selectedClient, onClientChange, className }: ClientsFilterProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { userRole, user, isAdmin } = useAuth();
  
  useEffect(() => {
    const loadClients = async () => {
      setIsLoading(true);
      try {
        console.log("Loading clients for ClientsFilter, userRole:", userRole, "userId:", user?.id);
        
        const clientsData = await fetchClients(userRole, user?.id);
        setClients(clientsData);
        
        // Si admin_client user, auto-select son client
        if (userRole === 'admin_client' && clientsData.length === 1) {
          onClientChange(clientsData[0].id);
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
