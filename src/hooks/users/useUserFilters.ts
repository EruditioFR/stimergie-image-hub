
import { useState, useEffect } from "react";

export function useUserFilters(
  isAdmin: boolean, 
  userClientId: string | null
) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Set default client filter for non-admin users
  useEffect(() => {
    if (!isAdmin && userClientId) {
      setSelectedClientId(userClientId);
    }
  }, [isAdmin, userClientId]);

  return {
    selectedClientId,
    selectedRole,
    setSelectedClientId,
    setSelectedRole
  };
}
