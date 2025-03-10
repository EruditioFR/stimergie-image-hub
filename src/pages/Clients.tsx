
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientForm } from "@/components/clients/ClientForm";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export interface Client {
  id?: string;
  nom: string;
  email: string;
  telephone?: string;
  entreprise?: string;
  notes?: string;
}

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();

  const addClient = (client: Client) => {
    // Génération d'un ID temporaire
    const newClient = { ...client, id: Date.now().toString() };
    setClients([...clients, newClient]);
    setShowForm(false);
    toast({
      title: "Client ajouté",
      description: `${client.nom} a été ajouté avec succès.`
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <ClientsHeader 
        onAddClick={() => setShowForm(true)} 
      />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {showForm ? (
          <ClientForm 
            onSubmit={addClient} 
            onCancel={() => setShowForm(false)} 
          />
        ) : (
          <ClientsList clients={clients} />
        )}
      </div>
    </div>
  );
}
