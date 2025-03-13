
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
  const { userRole } = useAuth();
  
  useEffect(() => {
    const loadClients = async () => {
      if (!['admin', 'admin_client'].includes(userRole)) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('id, nom')
          .order('nom', { ascending: true });
        
        if (error) {
          console.error('Error loading clients:', error);
          return;
        }
        
        setClients(data || []);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadClients();
  }, [userRole]);
  
  const handleValueChange = (value: string) => {
    onClientChange(value === 'all' ? null : value);
  };
  
  if (!['admin', 'admin_client'].includes(userRole) || clients.length === 0) {
    return null;
  }
  
  return (
    <div className={className}>
      <Select 
        value={selectedClient || 'all'} 
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Filtrer par client" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="all">Tous les clients</SelectItem>
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
