
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
    loading, 
    isAdmin, 
    canAccessClient, 
    canEditClient 
  } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check role permissions if allowedRoles is provided
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Check client access permissions
  if (requiresClient && clientId) {
    if (!canAccessClient(clientId)) {
      return <Navigate to="/" replace />;
    }
  }

  // Check edit permissions
  if (requiresEditPermission && clientId) {
    if (!canEditClient(clientId)) {
      return <Navigate to="/" replace />;
    }
  }

  // Render children if all permission checks pass
  return <>{children}</>;
}
