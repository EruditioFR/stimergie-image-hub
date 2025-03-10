
import { useAuth } from "@/context/AuthContext";
import { UserGreeting } from "./UserGreeting";

export function UserGreetingBar() {
  const { user } = useAuth();
  
  // Don't render anything if user is not logged in
  if (!user) return null;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-primary/10 py-1 text-center shadow-sm">
      <UserGreeting />
    </div>
  );
}
