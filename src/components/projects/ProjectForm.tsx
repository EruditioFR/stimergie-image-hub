
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Project } from "@/types/project";
import { Client } from "@/pages/Clients";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface ProjectFormProps {
  initialData?: Project;
  onSubmit: (project: Project) => void;
  onCancel: () => void;
}

export function ProjectForm({ initialData, onSubmit, onCancel }: ProjectFormProps) {
  const [formData, setFormData] = useState<Project>({
    nom_projet: "",
    type_projet: "",
    id_client: "",
    nom_dossier: ""
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingClients, setLoadingClients] = useState(true);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
    
    fetchClients();
  }, [initialData]);

  const fetchClients = async () => {
    try {
      setLoadingClients(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('nom');
      
      if (error) throw error;
      
      if (data) {
        setClients(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des clients:", error);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {initialData ? "Modifier le projet" : "Créer un nouveau projet"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="nom_projet" className="text-sm font-medium">Nom du projet *</label>
          <Input
            id="nom_projet"
            name="nom_projet"
            value={formData.nom_projet}
            onChange={handleChange}
            placeholder="Photoshoot Corporate"
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="id_client" className="text-sm font-medium">Client *</label>
          {loadingClients ? (
            <div className="flex items-center justify-center py-2">
              <LoadingSpinner size="sm" />
            </div>
          ) : (
            <Select 
              value={formData.id_client}
              onValueChange={(value) => handleSelectChange("id_client", value)}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id || ""} className="break-words">
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="type_projet" className="text-sm font-medium">Type de projet</label>
          <Input
            id="type_projet"
            name="type_projet"
            value={formData.type_projet || ""}
            onChange={handleChange}
            placeholder="Ex: Portrait, Événement, Mariage..."
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="nom_dossier" className="text-sm font-medium">Nom du dossier</label>
          <Input
            id="nom_dossier"
            name="nom_dossier"
            value={formData.nom_dossier || ""}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
            placeholder="Ex: ClientXYZ-2023"
          />
          <p className="text-xs text-muted-foreground">Le nom du dossier dans votre espace de stockage</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button type="submit" disabled={!formData.nom_projet || !formData.id_client || loading}>
            {loading ? <LoadingSpinner size="sm" /> : (initialData ? "Mettre à jour" : "Enregistrer")}
          </Button>
        </div>
      </form>
    </div>
  );
}
