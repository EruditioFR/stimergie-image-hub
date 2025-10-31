
/**
 * Module pour gérer les demandes de téléchargement par lot avec upload sur O2Switch
 */

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";
import JSZip from "jszip";
import { uploadZipToO2Switch, UploadResult } from "./o2switchUploader";
import { ImageForZip } from "./types";

// Limite pour diviser les téléchargements en plusieurs archives
const MAX_IMAGES_PER_BATCH = 50;

// Nombre d'images à télécharger simultanément (réduit pour limiter l'usage mémoire)
const DOWNLOAD_BATCH_SIZE = 5;

/**
 * Divise un tableau d'images en lots de taille maximale
 */
function splitIntoBatches<T>(array: T[], batchSize: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < array.length; i += batchSize) {
    batches.push(array.slice(i, i + batchSize));
  }
  return batches;
}

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

  // Si plus de 50 images, diviser en plusieurs archives pour éviter les timeouts
  if (images.length > MAX_IMAGES_PER_BATCH) {
    const batches = splitIntoBatches(images, MAX_IMAGES_PER_BATCH);
    console.log(`Dividing ${images.length} images into ${batches.length} batches`);
    
    if (showToasts) {
      toast.info(`Division en ${batches.length} archives`, {
        description: `Pour éviter les problèmes de timeout, vos ${images.length} images seront divisées en ${batches.length} archives de ${MAX_IMAGES_PER_BATCH} images maximum.`,
        duration: 5000
      });
    }
    
    // Traiter chaque lot séquentiellement pour éviter de surcharger
    let successCount = 0;
    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const batchSuccess = await processDownloadBatch(user, batch, isHD, showToasts, i + 1, batches.length);
      if (batchSuccess) successCount++;
    }
    
    if (showToasts) {
      if (successCount === batches.length) {
        toast.success(`${batches.length} archives créées avec succès`, {
          description: `Toutes vos images sont prêtes à être téléchargées dans la page Téléchargements.`
        });
      } else if (successCount > 0) {
        toast.warning(`${successCount}/${batches.length} archives créées`, {
          description: `Certaines archives ont échoué. Consultez la page Téléchargements.`
        });
      } else {
        toast.error("Échec de toutes les archives", {
          description: "Veuillez réessayer avec moins d'images."
        });
      }
    }
    
    return successCount > 0;
  }

  // Traitement normal pour moins de 50 images
  return processDownloadBatch(user, images, isHD, showToasts);
}

/**
 * Traite un lot d'images (fonction interne)
 */
async function processDownloadBatch(
  user: User,
  images: ImageForZip[],
  isHD: boolean,
  showToasts: boolean,
  batchNumber?: number,
  totalBatches?: number
): Promise<boolean> {
  const batchPrefix = batchNumber ? `[${batchNumber}/${totalBatches}] ` : "";
  const toastId = batchNumber ? `download-request-${batchNumber}` : "download-request";
  
  // Afficher le toast pendant le traitement
  if (showToasts) {
    toast.loading(`${batchPrefix}Préparation de votre demande...`, {
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
        image_id: String(images[0].id),
        image_title: `${batchPrefix}${images.length} images (${isHD ? "HD" : "Web"}) - En préparation`,
        image_src: images[0].url,
        status: "pending",
        is_hd: isHD,
        download_url: ""
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
      
      // Utiliser DOWNLOAD_BATCH_SIZE (5) pour éviter de surcharger la mémoire
      for (let i = 0; i < images.length; i += DOWNLOAD_BATCH_SIZE) {
        const batch = images.slice(i, i + DOWNLOAD_BATCH_SIZE);
        
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
          const progress = Math.min((i + DOWNLOAD_BATCH_SIZE), images.length);
          toast.loading(`${batchPrefix}Téléchargement : ${progress}/${images.length}`, {
            id: toastId,
            duration: Infinity
          });
        }
      }
      
      console.log(`[requestDownload] All images downloaded, starting ZIP generation for ${images.length} images`);
      
      // Calculer la taille estimée du ZIP (approximativement 60% de la taille totale des images)
      const estimatedSizeMB = Math.round((images.length * 2) * 0.6); // Estimation: 2MB par image en moyenne

      // 2.2 Générer le ZIP avec compression adaptative
      if (showToasts) {
        toast.loading(`${batchPrefix}Compression du ZIP... (environ ${estimatedSizeMB}MB)`, {
          id: toastId,
          duration: Infinity
        });
      }
      
      // Adapter le niveau de compression selon la taille estimée
      let compressionLevel: number;
      if (estimatedSizeMB < 50) {
        compressionLevel = 6; // Compression équilibrée
      } else if (estimatedSizeMB < 100) {
        compressionLevel = 3; // Compression actuelle
      } else {
        compressionLevel = 1; // Compression minimale pour les gros fichiers
      }
      
      console.log(`[requestDownload] Generating ZIP with compression level ${compressionLevel} (estimated: ${estimatedSizeMB}MB)`);
      
      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: compressionLevel }
      });
      
      const actualSizeMB = Math.round(zipBlob.size / 1024 / 1024);
      console.log(`[requestDownload] ZIP generated: ${actualSizeMB}MB (estimated: ${estimatedSizeMB}MB)`);
      console.log(`[requestDownload] Starting upload to O2Switch...`);
      
      // 2.3 Générer un nom de fichier unique
      const date = new Date();
      const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
      const zipFileName = `${isHD ? 'hd-' : ''}images_${dateStr}_${recordData.id}.zip`;

      // 2.4 Uploader le ZIP vers O2Switch
      if (showToasts) {
        toast.loading(`${batchPrefix}Envoi vers le serveur... (${actualSizeMB}MB)`, {
          id: toastId,
          duration: Infinity
        });
      }
      
      // Upload le ZIP et récupère le résultat détaillé
      const uploadResult: UploadResult = await uploadZipToO2Switch(zipBlob, zipFileName);
      
      console.log('[requestDownload] Upload result:', uploadResult);
      
      // Si l'upload a échoué
      if (!uploadResult.success || !uploadResult.url) {
        const errorMsg = uploadResult.error || "Échec de l'upload du ZIP (raison inconnue)";
        console.error(`[requestDownload] Upload failed: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      console.log("[requestDownload] Upload successful. URL:", uploadResult.url);
      
      // 2.5 Mettre à jour le statut de la demande avec l'URL de téléchargement
      const updateData = {
        download_url: uploadResult.url,
        status: "ready" as const,
        image_title: `${batchPrefix}${images.length} images (${isHD ? "HD" : "Web"}) - ${actualSizeMB}MB`
      };

      // Si processed_at est disponible dans le schéma, l'ajouter aux données
      try {
        const { error: updateError } = await supabase
          .from("download_requests")
          .update({
            ...updateData,
            processed_at: new Date().toISOString()
          })
          .eq("id", recordData.id);
        
        if (updateError) {
          console.error("Erreur lors de la mise à jour du statut:", updateError);
          console.log("Tentative avec les champs de base");
          
          // Retenter sans processed_at au cas où la colonne n'existerait pas encore
          const { error: fallbackUpdateError } = await supabase
            .from("download_requests")
            .update(updateData)
            .eq("id", recordData.id);
            
          if (fallbackUpdateError) {
            console.error("Échec de la mise à jour du statut (tentative alternative):", fallbackUpdateError);
            throw new Error(`Échec de la mise à jour du statut: ${fallbackUpdateError.message}`);
          }
        }
        
        console.log("[requestDownload] Database updated successfully with URL:", uploadResult.url);
      } catch (error) {
        console.error("Erreur lors de la mise à jour:", error);
        throw error;
      }
      
      // 2.6 Afficher le message de succès
      if (showToasts) {
        toast.dismiss(toastId);
        toast.success(`${batchPrefix}Téléchargement prêt`, {
          description: `Votre archive de ${images.length} images est prête.`,
          duration: 5000
        });
      }
      
      return true;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("[requestDownload] Error during ZIP creation/upload:", errorMessage);
      console.error("[requestDownload] Full error:", err);
      
      // Mettre à jour le statut de la demande en échec avec détails complets
      try {
        await supabase
          .from("download_requests")
          .update({
            status: "failed",
            processed_at: new Date().toISOString(),
            error_details: errorMessage,
            image_title: `${batchPrefix}Échec - ${images.length} images (${isHD ? "HD" : "Web"})`
          })
          .eq("id", recordData.id);
        
        console.log("[requestDownload] Database updated with error status");
      } catch (updateError) {
        // En cas d'échec de la mise à jour, tenter sans processed_at et error_details
        console.error("[requestDownload] Error updating failure status:", updateError);
        
        try {
          await supabase
            .from("download_requests")
            .update({
              status: "expired",
              image_title: `${batchPrefix}Échec - ${images.length} images (${isHD ? "HD" : "Web"})`
            })
            .eq("id", recordData.id);
        } catch (fallbackError) {
          console.error("[requestDownload] Failed to update with fallback status:", fallbackError);
        }
      }
      
      if (showToasts) {
        toast.dismiss(toastId);
        
        // Afficher une description plus détaillée selon l'erreur
        let description = errorMessage;
        if (errorMessage.includes("Timeout")) {
          description = `Le fichier est trop volumineux pour être traité. Essayez avec moins d'images (max ${Math.floor(images.length / 2)}).`;
        } else if (errorMessage.includes("upload_max_filesize") || errorMessage.includes("post_max_size")) {
          description = "Le serveur a refusé le fichier car il dépasse la taille maximale autorisée.";
        } else if (errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503")) {
          description = "Le serveur rencontre des difficultés. Réessayez dans quelques minutes.";
        }
        
        toast.error("Échec de la préparation du téléchargement", {
          description: description.substring(0, 150),
          duration: 7000
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
