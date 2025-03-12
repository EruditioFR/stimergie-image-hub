
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { useState } from "react";
import { UserGreetingBar } from "@/components/ui/UserGreetingBar";
import { ViewToggle, ViewMode } from "@/components/ui/ViewToggle";
import { useClients } from "@/hooks/useClients";
import { DeleteClientDialog } from "@/components/clients/DeleteClientDialog";
import { ClientFormDialog } from "@/components/clients/ClientFormDialog";

export interface Client {
  id?: string;
  nom: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  notes?: string;
  secteur_activite?: string;
  contact_principal?: string;
  created_at?: string;
  updated_at?: string;
}

export default function Clients() {
  const { clients, loading, addClient, updateClient, deleteClient } = useClients();
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleEditClient = (client: Client) => {
    setCurrentClient(client);
    setIsEditing(true);
    setShowForm(true);
  };

  const handleDeleteClient = (clientId: string) => {
    setClientToDelete(clientId);
    setDeleteError(null);
    setShowDeleteDialog(true);
  };

  const handleFormSubmit = async (client: Client) => {
    const success = isEditing 
      ? await updateClient(client)
      : await addClient(client);
    
    if (success) {
      setShowForm(false);
      setIsEditing(false);
      setCurrentClient(null);
    }
  };

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return;
    
    const result = await deleteClient(clientToDelete);
    if (result.success) {
      setShowDeleteDialog(false);
      setClientToDelete(null);
    } else {
      setDeleteError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <UserGreetingBar />
      <div className="pt-16 py-0">
        <ClientsHeader
          onAddClick={() => {
            setIsEditing(false);
            setCurrentClient(null);
            setShowForm(true);
          }}
        />
        <div className="max-w-7xl mx-auto px-6 py-8">
          <ClientFormDialog
            show={showForm}
            initialData={isEditing ? currentClient! : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setShowForm(false);
              setIsEditing(false);
              setCurrentClient(null);
            }}
          />

          {!showForm && (
            <>
              <div className="flex justify-end mb-6">
                <ViewToggle currentView={viewMode} onViewChange={setViewMode} />
              </div>
              <ClientsList
                clients={clients}
                loading={loading}
                onEdit={handleEditClient}
                onDelete={handleDeleteClient}
                viewMode={viewMode}
              />
            </>
          )}
        </div>
      </div>
      <Footer />

      <DeleteClientDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={confirmDeleteClient}
        error={deleteError}
      />
    </div>
  );
}
