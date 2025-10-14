
import { useMemo, useEffect } from 'react';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientsData } from '@/hooks/projects/useClientsData';

interface ClientsFilterProps {
  selectedClient: string | null;
  onClientChange: (clientId: string | null) => void;
  className?: string;
  userRole?: string;
  userClientId?: string | null;
  isAdmin?: boolean;
}

export function ClientsFilter({ selectedClient, onClientChange, className, userRole, userClientId, isAdmin = false }: ClientsFilterProps) {
  const { clients: allClients, loading: isLoading } = useClientsData();
  const isRegularUser = userRole === 'user';
  const isAdminClient = userRole === 'admin_client';
  
  // Filtrer les clients en fonction du rôle - mémorisé pour éviter recalculs
  const clients = useMemo(() => {
    // Les admins voient TOUS les clients, même s'ils ont un id_client
    if (isAdmin) {
      return allClients;
    }
    
    // Les admin_client et user sont limités à leur client
    if ((isRegularUser || isAdminClient) && userClientId) {
      return allClients.filter(client => client.id === userClientId);
    }
    
    return allClients;
  }, [allClients, isAdmin, isRegularUser, isAdminClient, userClientId]);
  
  // Auto-sélection du client pour les utilisateurs avec un seul client (sauf admins)
  useEffect(() => {
    if (!isAdmin && (isRegularUser || isAdminClient) && userClientId && clients.length === 1 && selectedClient !== userClientId) {
      onClientChange(userClientId);
    }
  }, [clients.length, userClientId, selectedClient, isAdmin, isRegularUser, isAdminClient, onClientChange]);
  
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
