
import { useAuth } from "@/context/AuthContext";

export function UserGreeting() {
  const { user } = useAuth();
  
  // If no user, don't render anything
  if (!user) return null;
  
  // Extract first name from user metadata if available
  const firstName = user.user_metadata?.first_name || 'Utilisateur';
  // Extract role from user metadata if available
  const role = user.user_metadata?.role || 'utilisateur';
  
  return (
    <div className="text-sm font-medium text-muted-foreground">
      Bonjour {firstName} ({role})
    </div>
  );
}
