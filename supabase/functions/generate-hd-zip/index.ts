
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.3";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { JSZip } from "https://deno.land/x/jszip@0.11.0/mod.ts";

// Configuration CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Handle CORS preflight requests
function handleCors(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
}

// Valider l'URL de l'image
function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return url.trim() !== '';
  } catch {
    return false;
  }
}

// Fonction pour transformer une URL JPG standard en URL HD
function transformToHDUrl(url: string): string {
  if (url.includes('/JPG/')) {
    return url.replace('/JPG/', '/');
  }
  return url; 
}

// Fonction pour attendre avec un délai spécifique (utile pour éviter de surcharger les serveurs)
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fonction pour télécharger une image
async function downloadImage(url: string): Promise<ArrayBuffer | null> {
  try {
    console.log(`Téléchargement de l'image: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Supabase Edge Function Image Downloader',
      },
    });
    
    if (!response.ok) {
      console.error(`Échec du téléchargement: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.arrayBuffer();
    
  } catch (error) {
    console.error(`Erreur lors du téléchargement: ${error.message}`);
    return null;
  }
}

// Fonction principale
serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  // Récupérer les variables d'environnement Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Variables d\'environnement manquantes');
    return new Response(JSON.stringify({
      success: false,
      error: 'Configuration serveur incorrecte'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Créer le client Supabase avec la clé de service pour accéder à toutes les tables
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Récupérer et valider les données de la requête
    const { userId, images } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({
        success: false,
        error: 'User ID manquant'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Aucune image valide fournie'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Préparer le fichier ZIP
    console.log(`Préparation du ZIP pour ${images.length} images`);
    const zip = new JSZip();
    const imgFolder = zip.folder("images");
    
    if (!imgFolder) {
      throw new Error("Impossible de créer le dossier dans l'archive ZIP");
    }
    
    // Récupérer les informations d'images depuis la base de données
    const imageIds = images.map(img => img.id).join(',');
    console.log(`Récupération des informations pour les images: ${imageIds}`);
    
    let downloadsSuccessful = 0;
    let downloadsFailures = 0;
    
    // Télécharger et ajouter chaque image au ZIP
    for (const [index, image] of images.entries()) {
      try {
        // Vérifier que l'URL est valide
        if (!isValidImageUrl(image.url)) {
          console.warn(`URL invalide pour l'image ${image.id}: ${image.url}`);
          downloadsFailures++;
          continue;
        }
        
        // Transformer l'URL en HD si nécessaire
        const imageUrl = transformToHDUrl(image.url);
        console.log(`Téléchargement de l'image ${index + 1}/${images.length}: ${imageUrl}`);
        
        // Télécharger l'image
        const imageData = await downloadImage(imageUrl);
        
        if (!imageData) {
          console.warn(`Échec du téléchargement pour l'image ${image.id}`);
          downloadsFailures++;
          continue;
        }
        
        // Générer un nom de fichier sécurisé pour l'image
        const safeTitle = image.title 
          ? image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
          : `image_${image.id}`;
          
        // Ajouter l'image au ZIP
        imgFolder.file(`${safeTitle}.jpg`, imageData);
        downloadsSuccessful++;
        
        // Pause courte entre les téléchargements pour éviter de surcharger
        if (index < images.length - 1) {
          await delay(100);
        }
        
      } catch (error) {
        console.error(`Erreur lors du traitement de l'image ${image.id}: ${error.message}`);
        downloadsFailures++;
      }
    }
    
    if (downloadsSuccessful === 0) {
      throw new Error("Aucune image n'a pu être téléchargée");
    }
    
    console.log(`Génération du ZIP avec ${downloadsSuccessful} images (${downloadsFailures} échecs)`);

    // Générer le fichier ZIP
    const zipContent = await zip.generateAsync({ type: "uint8array" });
    
    // Créer un nom de fichier unique pour le ZIP
    const timestamp = new Date().toISOString().replace(/[-T:\.Z]/g, '').substring(0, 14);
    const zipFilename = `hd-images_${timestamp}_${userId.substring(0, 8)}.zip`;
    
    // Stocker le fichier ZIP dans le bucket "zip_downloads"
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('zip_downloads')
      .upload(zipFilename, zipContent, {
        contentType: 'application/zip',
        cacheControl: '3600'
      });
      
    if (uploadError) {
      console.error(`Erreur lors de l'upload du ZIP: ${uploadError.message}`);
      throw new Error(`Échec de l'upload du ZIP: ${uploadError.message}`);
    }
    
    console.log("ZIP uploadé avec succès:", zipFilename);
    
    // Créer une URL signée valide pour 7 jours
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('zip_downloads')
      .createSignedUrl(zipFilename, 7 * 24 * 60 * 60); // 7 jours en secondes
    
    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error(`Erreur lors de la création de l'URL signée: ${signedUrlError?.message || 'URL non générée'}`);
      throw new Error("Impossible de créer l'URL de téléchargement");
    }
    
    // Enregistrer les informations dans la table download_requests
    const imageIdsArray = images.map(img => img.id);
    const firstImage = images[0];
    const { data: downloadRecord, error: downloadError } = await supabase
      .from('download_requests')
      .insert({
        user_id: userId,
        image_id: String(firstImage.id), // ID de la première image comme référence principale
        image_title: `Archive HD de ${downloadsSuccessful} image${downloadsSuccessful > 1 ? 's' : ''}`,
        image_src: firstImage.url || '',
        download_url: signedUrlData.signedUrl,
        status: 'ready', // Directement prêt car traité de manière synchrone
        is_hd: true
      })
      .select()
      .single();
    
    if (downloadError) {
      console.error(`Erreur lors de l'enregistrement du téléchargement: ${downloadError.message}`);
      throw new Error("Impossible d'enregistrer les informations de téléchargement");
    }
    
    console.log("Téléchargement enregistré avec succès:", downloadRecord);
    
    // Retourner la réponse avec l'URL signée
    return new Response(JSON.stringify({
      success: true,
      downloadId: downloadRecord.id,
      filename: zipFilename,
      url: signedUrlData.signedUrl,
      imageCount: downloadsSuccessful,
      failedCount: downloadsFailures
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error(`Erreur générale: ${error.message}`);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Une erreur est survenue lors du traitement'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
