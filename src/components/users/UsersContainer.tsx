
import { useState } from "react";
import { User } from "@/types/user";
import { UsersList } from "@/components/users/UsersList";
import { UserForm } from "@/components/users/UserForm";
import { DeleteUserDialog } from "@/components/users/dialog/DeleteUserDialog";
import { UserFilters } from "@/components/users/filters/UserFilters";
import { ViewMode } from "@/components/ui/ViewToggle";
import { useUsersContext } from "@/components/users/UsersContext";
import { useUsers } from "@/hooks/useUsers";
import { toast } from "sonner";

export function UsersContainer() {
  const {
    users,
    clients,
    loading,
    selectedClientId,
    selectedRole,
    showDeleteDialog,
    userToDelete,
    isAdmin,
    isAdminClient,
    canSeeClientFilter,
    setSelectedClientId,
    setSelectedRole,
    handleAddUser,
    handleUpdateUser,
    setShowDeleteDialog,
    setUserToDelete,
    confirmDeleteUser,
    availableRoles
  } = useUsers();

  const {
    currentUser,
    setCurrentUser,
    showAddForm,
    setShowAddForm,
    showEditForm,
    setShowEditForm
  } = useUsersContext();

  const [viewMode, setViewMode] = useState<ViewMode>("card");

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setShowEditForm(true);
  };

  const handleDeleteUser = (userId: string) => {
    setUserToDelete(userId);
    setShowDeleteDialog(true);
  };

  const handleUserSubmit = async (userData: Omit<User, 'id'> | User, password?: string) => {
    let success;
    if ('id' in userData) {
      success = await handleUpdateUser(userData, password);
    } else {
      success = await handleAddUser(userData, password);
    }

    if (success) {
      setShowAddForm(false);
      setShowEditForm(false);
      setCurrentUser(null);
    }
  };

  const handleConfirmDelete = async () => {
    const success = await confirmDeleteUser();
    if (success) {
      toast.success("L'utilisateur a été supprimé avec succès");
    }
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setShowEditForm(false);
    setCurrentUser(null);
  };

  if (showAddForm) {
    return (
      <UserForm 
        clients={clients}
        onSubmit={handleUserSubmit}
        onCancel={handleCancelForm}
        isAdmin={isAdmin}
      />
    );
  }

  if (showEditForm && currentUser) {
    return (
      <UserForm 
        clients={clients}
        initialData={currentUser}
        onSubmit={handleUserSubmit}
        onCancel={handleCancelForm}
        isEditing
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <>
      <UserFilters 
        selectedClientId={selectedClientId}
        setSelectedClientId={setSelectedClientId}
        selectedRole={selectedRole}
        setSelectedRole={setSelectedRole}
        viewMode={viewMode}
        setViewMode={setViewMode}
        clients={clients}
        visibleRoles={availableRoles}
        canSeeClientFilter={canSeeClientFilter}
        isAdminClient={isAdminClient}
        isAdmin={isAdmin}
      />
      
      <UsersList 
        users={users} 
        loading={loading} 
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
        viewMode={viewMode}
      />

      <DeleteUserDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
