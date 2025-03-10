
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { ClientsHeader } from "@/components/clients/ClientsHeader";
import { ClientsList } from "@/components/clients/ClientsList";
import { ClientForm } from "@/components/clients/ClientForm";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Update the Client interface to match the Supabase data structure
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
  const [clients, setClients] = useState<Client[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Map the Supabase data to our Client interface
        const mappedClients: Client[] = data.map(client => ({
          id: client.id,
          nom: client.nom,
          email: client.email, // Include the email field from database
          secteur_activite: client.secteur_activite,
          contact_principal: client.contact_principal,
          telephone: client.telephone, // Add telephone if it exists in your table
          created_at: client.created_at,
          updated_at: client.updated_at,
          // Map database fields to our Client interface fields
          entreprise: client.secteur_activite,
          notes: client.contact_principal
        }));
        
        setClients(mappedClients);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les clients.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addClient = async (client: Client) => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([
          { 
            nom: client.nom,
            email: client.email, // Include email field in the insert
            telephone: client.telephone,
            secteur_activite: client.entreprise, // Mapping entreprise à secteur_activite
            contact_principal: client.notes      // Mapping notes à contact_principal
          }
        ])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Map the returned data to match our Client interface
        const newClient: Client = {
          id: data[0].id,
          nom: data[0].nom,
          email: data[0].email, // Include email from database response
          telephone: data[0].telephone,
          entreprise: data[0].secteur_activite,
          notes: data[0].contact_principal,
          secteur_activite: data[0].secteur_activite,
          contact_principal: data[0].contact_principal,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at
        };
        
        setClients([...clients, newClient]);
        setShowForm(false);
        toast({
          title: "Client ajouté",
          description: `${client.nom} a été ajouté avec succès.`
        });
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du client:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le client.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="pt-16"> {/* Ajout d'un padding-top pour éviter que le contenu soit caché par le header fixe */}
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
            <ClientsList clients={clients} loading={loading} />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
