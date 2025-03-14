
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

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

      // With RLS disabled, we're simplifying access control logic
      // and relying more on frontend controls
      
      // If we got here, all checks passed
      setHasAccess(true);
      setLoading(false);
    };

    if (!authLoading) {
      checkAccess();
    }
  }, [user, userRole, authLoading, allowedRoles, isAdmin]);

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
