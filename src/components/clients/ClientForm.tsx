import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Client } from "@/pages/Clients";
import { X, Upload, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ClientFormProps {
  initialData?: Client;
  onSubmit: (client: Client) => void;
  onCancel: () => void;
}

export function ClientForm({ initialData, onSubmit, onCancel }: ClientFormProps) {
  const [formData, setFormData] = useState<Client>({
    nom: "",
    email: "",
    telephone: "",
    notes: "",
    logo: ""
  });
  const [uploading, setUploading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      if (initialData.logo) {
        setLogoPreview(initialData.logo);
      }
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Format invalide",
          description: "Veuillez choisir un fichier image (JPG, PNG, etc.)",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Fichier trop volumineux",
          description: "L'image ne doit pas dépasser 5 Mo",
          variant: "destructive"
        });
        return;
      }
      
      setLogoFile(file);
      
      // Create preview of the image
      const reader = new FileReader();
      reader.onload = (event) => {
        setLogoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return formData.logo || null;
    
    try {
      setUploading(true);
      
      // Create a unique file name
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `client-logos/${fileName}`;
      
      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(filePath, logoFile);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage
        .from('client-assets')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger le logo",
        variant: "destructive"
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If there's a logo file, upload it first
    if (logoFile) {
      const logoUrl = await uploadLogo();
      if (logoUrl) {
        onSubmit({ ...formData, logo: logoUrl });
      } else {
        // If logo upload failed but there was a previous logo, keep it
        onSubmit(formData);
      }
    } else {
      onSubmit(formData);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData(prev => ({ ...prev, logo: "" }));
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {initialData ? "Modifier le client" : "Ajouter un nouveau client"}
        </h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="nom" className="text-sm font-medium">Nom complet *</label>
            <Input
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleChange}
              placeholder="Jean Dupont"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email || ""}
              onChange={handleChange}
              placeholder="jean.dupont@example.com"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="telephone" className="text-sm font-medium">Téléphone</label>
            <Input
              id="telephone"
              name="telephone"
              value={formData.telephone || ""}
              onChange={handleChange}
              placeholder="01 23 45 67 89"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="logo" className="text-sm font-medium">Logo</label>
            <div className="flex flex-col space-y-2">
              {logoPreview ? (
                <div className="relative w-32 h-32 border rounded-md overflow-hidden">
                  <img 
                    src={logoPreview} 
                    alt="Logo prévisualisé" 
                    className="w-full h-full object-contain"
                  />
                  <Button 
                    type="button" 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={removeLogo}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-md bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div>
                <label 
                  htmlFor="logo-upload" 
                  className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                >
                  <Upload size={16} />
                  <span>Choisir un logo</span>
                </label>
                <input
                  id="logo-upload"
                  name="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="notes" className="text-sm font-medium">Notes</label>
          <Textarea
            id="notes"
            name="notes"
            value={formData.notes || ""}
            onChange={handleChange}
            placeholder="Informations complémentaires..."
            rows={4}
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={uploading}>
            Annuler
          </Button>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Téléchargement..." : initialData ? "Mettre à jour" : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
