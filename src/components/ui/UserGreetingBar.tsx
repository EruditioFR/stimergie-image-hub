
import { useAuth } from "@/context/AuthContext";
import { UserGreeting } from "./UserGreeting";

export function UserGreetingBar() {
  const { user } = useAuth();
  
  // Don't render anything if user is not logged in
  if (!user) return null;
  
  return (
    <div className="bg-primary/10 py-1 text-center shadow-sm">
      <UserGreeting />
    </div>
  );
}
