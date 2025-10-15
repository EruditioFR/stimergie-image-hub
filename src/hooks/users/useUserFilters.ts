
import { useState, useEffect } from "react";

export function useUserFilters(
  isAdmin: boolean,
  isAdminClient: boolean,
  userClientId: string | null,
  userClientIds: string[]
) {
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Set default client filter ONLY for regular users (mono-client)
  useEffect(() => {
    if (!isAdmin && !isAdminClient && userClientId) {
      // Regular user with single client: force selection
      setSelectedClientId(userClientId);
    }
    // Admin_client with multi-clients: leave "All clients" by default
  }, [isAdmin, isAdminClient, userClientId]);

  return {
    selectedClientId,
    selectedRole,
    setSelectedClientId,
    setSelectedRole
  };
}
