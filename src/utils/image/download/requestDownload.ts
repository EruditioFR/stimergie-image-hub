
/**
 * Module pour gérer les demandes de téléchargement par lot avec upload sur O2Switch
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import JSZip from "jszip";
import { uploadZipToO2Switch } from "./o2switchUploader";
import { ImageForZip } from "./types";

/**
 * Traite une demande de téléchargement en masse sur le serveur
 * @param user Utilisateur actuel
 * @param images Images à télécharger
 * @param isHD Indique si c'est un téléchargement HD
 * @param showToasts Flag pour afficher/masquer les toasts (utile quand on utilise un modal)
 * @returns true si la demande a été traitée avec succès, false sinon
 */
export async function requestServerDownload(
  user: User | null,
  images: ImageForZip[],
  isHD = false,
  showToasts = true
): Promise<boolean> {
  if (!user) {
    if (showToasts) toast.error("Vous devez être connecté pour utiliser cette fonctionnalité");
    return false;
  }

  if (!images || images.length === 0) {
    if (showToasts) toast.error("Aucune image sélectionnée pour le téléchargement");
    return false;
  }

  // Afficher le toast pendant le traitement
  const toastId = "download-request";
  if (showToasts) {
    toast.loading("Préparation de votre demande...", {
      id: toastId,
      duration: Infinity
    });
  }

  try {
    // 1. Créer l'enregistrement dans la base de données
    const { data: recordData, error: recordError } = await supabase
      .from("download_requests")
      .insert({
        user_id: user.id,
        image_id: String(images[0].id),  // Convertir explicitement en string
        image_title: `${images.length} images (${isHD ? "HD" : "Web"}) - En préparation`,
        image_src: images[0].url,
        status: "pending",
        is_hd: isHD,
        download_url: ""  // Initialisé vide, sera mis à jour après l'upload
      })
      .select("id")
      .single();

    if (recordError) {
      console.error("Erreur lors de la création de la demande:", recordError);
      if (showToasts) {
        toast.dismiss(toastId);
        toast.error("Échec de l'enregistrement de la demande");
      }
      return false;
    }

    console.log(`Demande créée avec l'ID: ${recordData.id}`);

    // 2. Créer directement le ZIP en local et l'uploader vers O2Switch
    try {
      // 2.1 Créer le ZIP
      const zip = new JSZip();
      const imgFolder = zip.folder("images");
      
      if (!imgFolder) {
        throw new Error("Échec de la création du dossier dans le ZIP");
      }
      
      // Limiter à un maximum de 10 images simultanées pour éviter de surcharger la mémoire
      const BATCH_SIZE = 10;
      for (let i = 0; i < images.length; i += BATCH_SIZE) {
        const batch = images.slice(i, i + BATCH_SIZE);
        
        // Télécharger les images par lot
        const downloadPromises = batch.map(async (image) => {
          try {
            const response = await fetch(image.url);
            if (!response.ok) throw new Error(`HTTP error ${response.status}`);
            
            const blob = await response.blob();
            const safeTitle = image.title 
              ? image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
              : `image_${image.id}`;
              
            return { name: `${safeTitle}.jpg`, blob };
          } catch (err) {
            console.error(`Échec du téléchargement de l'image ${image.id}:`, err);
            return null;
          }
        });
        
        // Attendre que toutes les images du lot soient traitées
        const results = await Promise.all(downloadPromises);
        
        // Ajouter les images réussies au ZIP
        results.forEach(result => {
          if (result) {
            imgFolder.file(result.name, result.blob);
          }
        });
        
        // Mettre à jour le toast pendant le traitement
        if (showToasts) {
          toast.loading(`Préparation : ${Math.min((i + BATCH_SIZE), images.length)}/${images.length}`, {
            id: toastId,
            duration: Infinity
          });
        }
      }

      // 2.2 Générer le ZIP
      if (showToasts) {
        toast.loading("Compression du ZIP...", {
          id: toastId,
          duration: Infinity
        });
      }
      
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 3 }
      });
      
      // 2.3 Générer un nom de fichier unique
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const zipFileName = `${isHD ? 'hd-' : ''}images_${dateStr}_${recordData.id}.zip`;

      // 2.4 Uploader le ZIP vers O2Switch
      if (showToasts) {
        toast.loading("Envoi vers le serveur...", {
          id: toastId,
          duration: Infinity
        });
      }
      
      // Upload le ZIP et récupère directement l'URL retournée par le serveur
      const downloadUrl = await uploadZipToO2Switch(zipBlob, zipFileName);
      
      // Si l'upload a échoué mais n'a pas généré d'erreur
      if (!downloadUrl) {
        throw new Error("Échec de l'upload du ZIP");
      }

      console.log("Téléchargement URL générée par le serveur:", downloadUrl);
      
      // 2.5 Mettre à jour le statut de la demande avec l'URL de téléchargement
      const { error: updateError } = await supabase
        .from("download_requests")
        .update({
          download_url: downloadUrl,
          status: "ready",
          processed_at: new Date().toISOString(),
          image_title: `${images.length} images (${isHD ? "HD" : "Web"})`
        })
        .eq("id", recordData.id);
      
      if (updateError) {
        console.error("Erreur lors de la mise à jour du statut:", updateError);
        console.log("Tentative de mise à jour a échoué pour:", {
          downloadUrl,
          status: "ready",
          id: recordData.id
        });
        throw new Error(`Échec de la mise à jour du statut: ${updateError.message}`);
      } else {
        console.log("Mise à jour réussie dans la base de données avec l'URL:", downloadUrl);
      }
      
      // 2.6 Afficher le message de succès
      if (showToasts) {
        toast.dismiss(toastId);
        toast.success("Téléchargement prêt", {
          description: `Votre archive de ${images.length} images est prête.`,
          duration: 5000
        });
      }
      
      return true;

    } catch (err) {
      console.error("Erreur lors de la création du ZIP:", err);
      
      // Mettre à jour le statut de la demande en échec
      await supabase
        .from("download_requests")
        .update({
          status: "expired",
          processed_at: new Date().toISOString(),
          image_title: `Échec - ${images.length} images (${isHD ? "HD" : "Web"})`
        })
        .eq("id", recordData.id);
      
      if (showToasts) {
        toast.dismiss(toastId);
        toast.error("Échec de la préparation du téléchargement", {
          description: err instanceof Error ? err.message : "Une erreur inconnue est survenue"
        });
      }
      
      return false;
    }

  } catch (error) {
    console.error("Erreur globale:", error);
    
    if (showToasts) {
      toast.dismiss(toastId);
      toast.error("Échec du téléchargement", {
        description: "Une erreur inattendue est survenue"
      });
    }
    
    return false;
  }
}
