
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useClientsData() {
  const [clients, setClients] = useState<{ id: string; nom: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('id, nom')
        .order('nom');

      if (error) throw error;
      if (data) setClients(data);
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les clients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  return {
    clients,
    loading,
    fetchClients
  };
}
