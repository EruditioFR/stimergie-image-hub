
import { useUserPermissions } from "./users/useUserPermissions";
import { useUserFilters } from "./users/useUserFilters";
import { useUserData } from "./users/useUserData";
import { useUserCrud } from "./users/useUserCrud";

export function useUsers() {
  // Get user permissions and role information
  const {
    userClientId,
    isAdmin,
    isAdminClient,
    canSeeClientFilter,
    availableRoles
  } = useUserPermissions();

  // Get user filters
  const {
    selectedClientId,
    selectedRole,
    setSelectedClientId,
    setSelectedRole
  } = useUserFilters(isAdmin, userClientId);

  // Get user and client data
  const {
    users,
    clients,
    loading,
    setUsers
  } = useUserData(selectedClientId, selectedRole, userClientId, isAdmin);

  // Get CRUD operations
  const {
    showDeleteDialog,
    userToDelete,
    setShowDeleteDialog,
    setUserToDelete,
    handleAddUser,
    handleUpdateUser,
    confirmDeleteUser
  } = useUserCrud(setUsers, clients);

  // Return everything needed by the components
  return {
    // User data
    users,
    clients,
    loading,
    
    // Filters
    selectedClientId,
    selectedRole,
    setSelectedClientId,
    setSelectedRole,
    
    // Delete dialog state
    showDeleteDialog,
    userToDelete,
    setShowDeleteDialog,
    setUserToDelete,
    
    // User permissions
    isAdmin,
    isAdminClient,
    canSeeClientFilter,
    
    // CRUD operations
    handleAddUser,
    handleUpdateUser,
    confirmDeleteUser,
    
    // Available roles based on user permissions
    availableRoles
  };
}
