import { useQuery } from "@tanstack/react-query";
import { fetchClients } from "@/services/clientService";

export function useClientsData() {
  const { data: clients = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  return {
    clients: clients.map(c => ({ id: c.id, nom: c.nom })),
    loading,
    fetchClients: refetch
  };
}
