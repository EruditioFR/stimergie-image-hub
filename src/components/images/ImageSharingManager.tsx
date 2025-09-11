import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Share2, Plus } from "lucide-react";
import { 
  shareImageWithClient, 
  unshareImageFromClient, 
  getImageSharedClients,
  ImageSharedClient 
} from "@/services/gallery/sharingService";
import { useClients } from "@/hooks/useClients";

interface ImageSharingManagerProps {
  imageId: number;
  primaryClientId?: string;
  onSharingChange?: () => void;
}

export function ImageSharingManager({ 
  imageId, 
  primaryClientId, 
  onSharingChange 
}: ImageSharingManagerProps) {
  const [sharedClients, setSharedClients] = useState<ImageSharedClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { clients } = useClients();

  // Filter out the primary client from available clients
  const availableClients = clients.filter(client => 
    client.id !== primaryClientId && 
    !sharedClients.some(shared => shared.client_id === client.id)
  );

  useEffect(() => {
    loadSharedClients();
  }, [imageId]);

  const loadSharedClients = async () => {
    setLoading(true);
    try {
      const { data, error } = await getImageSharedClients(imageId);
      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les partages",
          variant: "destructive"
        });
      } else {
        setSharedClients(data);
      }
    } catch (error) {
      console.error('Error loading shared clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleShareWithClient = async () => {
    if (!selectedClientId) return;
    
    setIsSharing(true);
    try {
      const { success, error } = await shareImageWithClient(imageId, selectedClientId);
      
      if (success) {
        toast({
          title: "Succès",
          description: "Image partagée avec succès"
        });
        setSelectedClientId("");
        await loadSharedClients();
        onSharingChange?.();
      } else {
        toast({
          title: "Erreur",
          description: error || "Impossible de partager l'image",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleUnshareFromClient = async (clientId: string) => {
    try {
      const { success, error } = await unshareImageFromClient(imageId, clientId);
      
      if (success) {
        toast({
          title: "Succès",
          description: "Partage retiré avec succès"
        });
        await loadSharedClients();
        onSharingChange?.();
      } else {
        toast({
          title: "Erreur",
          description: error || "Impossible de retirer le partage",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Share2 className="h-4 w-4" />
          Partage avec d'autres clients
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current shared clients */}
        {sharedClients.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">Partagé avec :</p>
            <div className="flex flex-wrap gap-2">
              {sharedClients.map((shared) => (
                <Badge 
                  key={shared.id} 
                  variant="secondary" 
                  className="flex items-center gap-1"
                >
                  {shared.client_name}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleUnshareFromClient(shared.client_id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Add new sharing */}
        {availableClients.length > 0 && (
          <div className="flex gap-2">
            <Select 
              value={selectedClientId} 
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sélectionner un client..." />
              </SelectTrigger>
              <SelectContent>
                {availableClients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleShareWithClient}
              disabled={!selectedClientId || isSharing}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}

        {availableClients.length === 0 && sharedClients.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Aucun autre client disponible pour le partage
          </p>
        )}
      </CardContent>
    </Card>
  );
}