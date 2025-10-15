import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Share2, Plus } from "lucide-react";
import { shareImageWithClient, unshareImageFromClient, getImageSharedClients, ImageSharedClient } from "@/services/gallery/sharingService";
import { useClients } from "@/hooks/useClients";
import { useAuth } from "@/context/AuthContext";
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
  const {
    toast
  } = useToast();
  const {
    clients
  } = useClients();
  const {
    isAdmin,
    userRole
  } = useAuth();

  // Only administrators can share images with other clients
  if (userRole !== 'admin') {
    return null;
  }

  // Filter out the primary client from available clients
  const availableClients = clients.filter(client => client.id !== primaryClientId && !sharedClients.some(shared => shared.client_id === client.id));
  useEffect(() => {
    loadSharedClients();
  }, [imageId]);
  const loadSharedClients = async () => {
    setLoading(true);
    try {
      const {
        data,
        error
      } = await getImageSharedClients(imageId);
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
      const {
        success,
        error
      } = await shareImageWithClient(imageId, selectedClientId);
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
      const {
        success,
        error
      } = await unshareImageFromClient(imageId, clientId);
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
  return;
}