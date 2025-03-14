
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function useDashboardData() {
  const { user, userRole } = useAuth();
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function fetchClientId() {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id_client")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Erreur lors de la récupération de l'ID client:", error);
        } else if (data) {
          setClientId(data.id_client);
        }
      } catch (error) {
        console.error("Erreur inattendue:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchClientId();
  }, [user]);

  // Détermine le type de dashboard à afficher en fonction du rôle de l'utilisateur
  const getDashboardType = () => {
    if (!user) return "guest";
    
    switch (userRole) {
      case "admin":
        return "admin";
      case "admin_client":
        return "admin_client";
      default:
        return "user";
    }
  };

  return {
    loading,
    clientId,
    dashboardType: getDashboardType()
  };
}
