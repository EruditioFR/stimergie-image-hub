
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export function UserGreeting() {
  const { user } = useAuth();
  const [firstName, setFirstName] = useState("Utilisateur");
  const [role, setRole] = useState("utilisateur");
  const [loading, setLoading] = useState(true);
  
  // Si pas d'utilisateur, ne rien afficher
  if (!user) return null;
  
  // Afficher les données utilisateur pour le débogage
  console.log("User data:", user);
  console.log("User metadata:", user.user_metadata);
  
  useEffect(() => {
    async function fetchProfileData() {
      try {
        setLoading(true);
        
        // Requête pour trouver le profil correspondant à l'email de l'utilisateur connecté
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, role")
          .eq("email", user.email)
          .maybeSingle();
        
        if (error) {
          console.error("Erreur lors de la récupération du profil:", error);
          return;
        }
        
        console.log("Profile data:", data);
        
        if (data) {
          // Si on trouve un profil correspondant, utiliser ses données
          setFirstName(data.first_name || user.email.split('@')[0]);
          setRole(data.role || "utilisateur");
        } else {
          // Fallback: utiliser les métadonnées utilisateur comme avant
          let name = 'Utilisateur';
          let userRole = '';
          
          if (user.user_metadata?.first_name) {
            name = user.user_metadata.first_name;
          } else if (user.user_metadata?.firstName) {
            name = user.user_metadata.firstName;
          } else if (user.app_metadata?.first_name) {
            name = user.app_metadata.first_name;
          } else if (user.email) {
            name = user.email.split('@')[0];
          }
          
          if (user.user_metadata?.role) {
            userRole = user.user_metadata.role;
          } else if (user.app_metadata?.role) {
            userRole = user.app_metadata.role;
          } else {
            userRole = 'utilisateur';
          }
          
          setFirstName(name);
          setRole(userRole);
        }
      } catch (err) {
        console.error("Erreur inattendue:", err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchProfileData();
  }, [user]);
  
  if (loading) {
    return (
      <div className="text-sm font-medium text-muted-foreground animate-pulse">
        Chargement...
      </div>
    );
  }
  
  return (
    <div className="text-sm font-medium text-muted-foreground">
      Bonjour {firstName} ({role})
    </div>
  );
}
