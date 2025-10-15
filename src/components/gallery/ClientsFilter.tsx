
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
  userClientIds?: string[];
  isAdmin?: boolean;
}

export function ClientsFilter({ selectedClient, onClientChange, className, userRole, userClientId, userClientIds = [], isAdmin = false }: ClientsFilterProps) {
  const { clients: allClients, loading: isLoading } = useClientsData();
  const isRegularUser = userRole === 'user';
  const isAdminClient = userRole === 'admin_client';
  
  // Filtrer les clients en fonction du rôle - mémorisé pour éviter recalculs
  const clients = useMemo(() => {
    // Les admins voient TOUS les clients, même s'ils ont un id_client
    if (isAdmin) {
      return allClients;
    }
    
    // Les admin_client et user avec plusieurs clients voient tous leurs clients
    if ((isRegularUser || isAdminClient) && userClientIds.length > 0) {
      return allClients.filter(client => userClientIds.includes(client.id));
    }
    
    // Fallback sur userClientId unique si pas de userClientIds
    if ((isRegularUser || isAdminClient) && userClientId && userClientIds.length === 0) {
      return allClients.filter(client => client.id === userClientId);
    }
    
    return allClients;
  }, [allClients, isAdmin, isRegularUser, isAdminClient, userClientId, userClientIds]);
  
  // Auto-sélection du client seulement pour les utilisateurs avec un seul client (sauf admins)
  useEffect(() => {
    if (!isAdmin && (isRegularUser || isAdminClient) && clients.length === 1 && userClientIds.length === 1 && selectedClient !== userClientIds[0]) {
      onClientChange(userClientIds[0]);
    }
  }, [clients.length, userClientIds, selectedClient, isAdmin, isRegularUser, isAdminClient, onClientChange]);
  
  const handleValueChange = (value: string) => {
    // Autoriser le changement pour les utilisateurs avec plusieurs clients
    const hasMultipleClients = userClientIds.length > 1;
    
    // Ne pas autoriser les utilisateurs réguliers avec un seul client à changer
    if (isRegularUser && !hasMultipleClients) {
      console.log("Users with role 'user' and single client cannot change their client filter");
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
  
  const hasMultipleClients = userClientIds.length > 1;
  const canChangeClient = isAdmin || (hasMultipleClients && (isRegularUser || isAdminClient));

  return (
    <div className={className}>
      <Select 
        value={selectedClient || 'all'} 
        onValueChange={handleValueChange}
        disabled={isLoading || (!canChangeClient)}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrer par client" />
        </SelectTrigger>
        <SelectContent side="bottom" sideOffset={4} avoidCollisions={false} className="z-50 bg-background">
          <SelectGroup>
            {(isAdmin || userClientIds.length > 1) && <SelectItem value="all">Tous les clients</SelectItem>}
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
