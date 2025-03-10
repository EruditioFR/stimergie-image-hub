
import { useAuth } from "@/context/AuthContext";

export function UserGreeting() {
  const { user } = useAuth();
  
  // Si pas d'utilisateur, ne rien afficher
  if (!user) return null;
  
  // Afficher les données utilisateur pour le débogage
  console.log("User data:", user);
  console.log("User metadata:", user.user_metadata);
  
  // Extraire le prénom des métadonnées utilisateur
  // Vérifier d'abord dans user_metadata, puis dans app_metadata, et enfin dans le profil si disponible
  let firstName = 'Utilisateur';
  
  if (user.user_metadata?.first_name) {
    firstName = user.user_metadata.first_name;
  } else if (user.user_metadata?.firstName) {
    firstName = user.user_metadata.firstName;
  } else if (user.app_metadata?.first_name) {
    firstName = user.app_metadata.first_name;
  } else if (user.email) {
    // Si aucun nom n'est trouvé, utiliser la partie avant @ de l'email
    firstName = user.email.split('@')[0];
  }
  
  // Extraire le rôle des métadonnées utilisateur
  // Vérifier dans user_metadata et app_metadata
  let role = '';
  
  if (user.user_metadata?.role) {
    role = user.user_metadata.role;
  } else if (user.app_metadata?.role) {
    role = user.app_metadata.role;
  } else {
    // Valeur par défaut si aucun rôle n'est trouvé
    role = 'utilisateur';
  }
  
  return (
    <div className="text-sm font-medium text-muted-foreground">
      Bonjour {firstName} ({role})
    </div>
  );
}
