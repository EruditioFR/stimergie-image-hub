
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  requiresClient?: boolean;
  clientId?: string | null;
  requiresEditPermission?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requiresClient = false,
  clientId = null,
  requiresEditPermission = false
}: ProtectedRouteProps) {
  const { 
    user, 
    userRole, 
    loading: authLoading, 
    isAdmin 
  } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Not authenticated
      if (!user) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Admin bypass - administrators always have access to everything
      if (isAdmin()) {
        setHasAccess(true);
        setLoading(false);
        return;
      }

      // Check role permissions if allowedRoles is provided
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log(`User role ${userRole} not in allowed roles:`, allowedRoles);
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // Check client access permissions
      if (requiresClient && clientId) {
        try {
          const { data, error } = await supabase.rpc('check_can_access_client', {
            client_id: clientId
          });
          
          if (error || !data) {
            console.log(`User cannot access client ${clientId}`);
            setHasAccess(false);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error("Error checking client access:", error);
          setHasAccess(false);
          setLoading(false);
          return;
        }
      }

      // Check edit permissions
      if (requiresEditPermission && clientId) {
        // Admin can edit any client
        if (isAdmin()) {
          setHasAccess(true);
          setLoading(false);
          return;
        }
        
        // For admin_client, check if they belong to this client
        if (userRole === 'admin_client') {
          try {
            const { data: userClientId } = await supabase.rpc('get_user_client_id', {
              user_id: user.id
            });
            
            if (userClientId === clientId) {
              setHasAccess(true);
            } else {
              console.log(`User cannot edit client ${clientId}`);
              setHasAccess(false);
            }
          } catch (error) {
            console.error("Error checking edit permissions:", error);
            setHasAccess(false);
          }
        } else {
          // Regular users cannot edit clients
          setHasAccess(false);
        }
        
        setLoading(false);
        return;
      }

      // If we got here, all checks passed
      setHasAccess(true);
      setLoading(false);
    };

    if (!authLoading) {
      checkAccess();
    }
  }, [user, userRole, authLoading, allowedRoles, requiresClient, clientId, requiresEditPermission, isAdmin]);

  // Show loading state while checking authentication
  if (authLoading || loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated or no access
  if (!hasAccess) {
    return <Navigate to="/auth" replace />;
  }

  // Render children if all permission checks pass
  return <>{children}</>;
}
