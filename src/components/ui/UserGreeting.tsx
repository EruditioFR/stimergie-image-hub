
import { useAuth } from "@/context/AuthContext";

export function UserGreeting() {
  const { user } = useAuth();
  
  // Si pas d'utilisateur, ne rien afficher
  if (!user) return null;
  
  // Afficher les données utilisateur pour le débogage
  console.log("User data:", user);
  console.log("User metadata:", user.user_metadata);
  
  // Extraire le prénom des métadonnées utilisateur si disponible
  const firstName = user.user_metadata?.first_name || user.user_metadata?.firstName || 'Utilisateur';
  // Extraire le rôle des métadonnées utilisateur si disponible
  const role = user.user_metadata?.role || 'utilisateur';
  
  return (
    <div className="text-sm font-medium text-muted-foreground">
      Bonjour {firstName} ({role})
    </div>
  );
}
