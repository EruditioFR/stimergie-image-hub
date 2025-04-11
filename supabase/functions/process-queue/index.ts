
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// En-têtes CORS pour permettre les requêtes cross-origin
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Interface pour les demandes de téléchargement
interface DownloadRequest {
  id: string;
  user_id: string;
  image_id: string;
  image_title: string;
  image_src: string;
  status: 'pending' | 'processing' | 'ready' | 'failed';
  is_hd: boolean;
  download_url: string;
  created_at: string;
  processed_at?: string;
  error_details?: string;
}

// Interface pour la configuration de traitement
interface ProcessConfig {
  max_batch_size: number;
  processing_timeout_seconds: number;
}

// Configuration par défaut
const DEFAULT_CONFIG: ProcessConfig = {
  max_batch_size: 5, // Maximum 5 demandes à la fois
  processing_timeout_seconds: 600, // 10 minutes par traitement
};

/**
 * Télécharge une image avec mécanisme de nouvelles tentatives en cas d'échec
 */
async function fetchImageWithRetries(
  url: string,
  retries = 3,
  delay = 300
): Promise<ArrayBuffer> {
  try {
    console.log(`🌐 Téléchargement de l'image: ${url}`);
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });

    if (!response.ok) {
      console.warn(`⚠️ HTTP error ${response.status} pour ${url}`);
      if (retries > 0 && response.status >= 500) {
        console.log(`🔄 Nouvelle tentative dans ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchImageWithRetries(url, retries - 1, delay * 2);
      }
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`❌ Erreur lors du téléchargement: ${error.message}`);
    if (retries > 0) {
      console.log(`🔄 Nouvelle tentative dans ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchImageWithRetries(url, retries - 1, delay * 2);
    }
    throw error;
  }
}

/**
 * Crée un fichier ZIP à partir d'un tableau d'images
 */
async function createZipFile(
  downloadRequest: DownloadRequest,
  supabase: any
): Promise<{ zipData: Uint8Array; imageCount: number }> {
  // Récupérer les détails de l'image si c'est une seule image
  // ou récupérer les détails du projet si c'est un projet entier
  let images: { id: string; title: string; url: string }[] = [];
  
  try {
    // Si l'URL de l'image contient "stimergie", c'est probablement une demande pour plusieurs images
    if (downloadRequest.image_src.includes('stimergie')) {
      // Extraire l'ID du projet de l'URL si possible
      const projectIdMatch = downloadRequest.image_src.match(/\/project\/([^\/]+)/);
      const projectId = projectIdMatch ? projectIdMatch[1] : null;
      
      if (projectId) {
        console.log(`📂 Récupération des images du projet ${projectId}`);
        const { data: projectImages, error } = await supabase
          .from('images')
          .select('id, title, url')
          .eq('id_projet', projectId);
        
        if (error) throw new Error(`Erreur lors de la récupération des images: ${error.message}`);
        
        if (projectImages && projectImages.length > 0) {
          images = projectImages;
          console.log(`📊 ${images.length} images trouvées pour le projet`);
        }
      }
    }
    
    // Si nous n'avons pas trouvé d'images de projet ou si ce n'est pas une URL de projet, 
    // utilisons simplement l'image unique spécifiée dans la demande
    if (images.length === 0) {
      images = [{
        id: downloadRequest.image_id,
        title: downloadRequest.image_title || `image_${downloadRequest.image_id}`,
        url: downloadRequest.image_src
      }];
      console.log(`🖼️ Traitement d'une seule image: ${downloadRequest.image_title}`);
    }

    const zip = new JSZip();
    const folder = zip.folder("images");
    if (!folder) throw new Error("Impossible de créer le dossier ZIP");

    let successfulImages = 0;
    const BATCH_SIZE = 3; // Télécharger 3 images à la fois pour éviter de surcharger
    
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(async image => {
        try {
          console.log(`⬇️ Téléchargement de ${image.title || 'image sans titre'}`);
          const buffer = await fetchImageWithRetries(image.url);
          const safeName = (image.title || `image_${image.id}`).replace(/[^a-z0-9]/gi, "_").toLowerCase();
          folder.file(`${safeName}.jpg`, buffer);
          return true;
        } catch (err) {
          console.error(`❌ Erreur pour l'image ${image.id}: ${err.message}`);
          return false;
        }
      }));
      
      // Compter les images téléchargées avec succès
      successfulImages += results.filter(r => r.status === "fulfilled" && r.value === true).length;
    }

    if (successfulImages === 0) {
      throw new Error("Aucune image n'a pu être téléchargée");
    }

    console.log(`🔄 Compression de ${successfulImages} images...`);
    const zipData = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 5 },
    });

    return { zipData, imageCount: successfulImages };
  } catch (error) {
    console.error(`❌ Erreur lors de la création du ZIP: ${error.message}`);
    throw error;
  }
}

/**
 * Upload le fichier ZIP au stockage Supabase
 */
async function uploadZipToStorage(
  zipData: Uint8Array,
  fileName: string,
  supabase: any
): Promise<string> {
  try {
    console.log(`⬆️ Upload du fichier ZIP: ${fileName}`);
    
    // Vérifier d'abord si le bucket existe
    const { data: buckets, error: bucketError } = await supabase.storage
      .listBuckets();
    
    const zipBucket = buckets?.find(b => b.name === "ZIP Downloads");
    
    if (!zipBucket) {
      console.log("❗ Bucket 'ZIP Downloads' non trouvé, tentative de création...");
      
      // Créer le bucket s'il n'existe pas
      const { error: createError } = await supabase.storage
        .createBucket("ZIP Downloads", { public: true });
      
      if (createError) {
        throw new Error(`Échec de la création du bucket: ${createError.message}`);
      }
      console.log("✅ Bucket 'ZIP Downloads' créé avec succès");
    }
    
    const { error } = await supabase.storage
      .from('ZIP Downloads')
      .upload(fileName, zipData, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (error) throw new Error(`Échec de l'upload: ${error.message}`);

    // Créer une URL publique
    const { data, error: publicUrlError } = await supabase.storage
      .from('ZIP Downloads')
      .getPublicUrl(fileName);

    if (publicUrlError || !data?.publicUrl) {
      throw new Error("Échec de la génération de l'URL publique");
    }
    
    console.log(`✅ URL publique créée: ${data.publicUrl.substring(0, 50)}...`);
    return data.publicUrl;
  } catch (error) {
    console.error(`❌ Erreur lors de l'upload: ${error.message}`);
    throw error;
  }
}

/**
 * Traitement d'une demande de téléchargement
 */
async function processDownloadRequest(
  downloadRequest: DownloadRequest,
  supabase: any
): Promise<void> {
  try {
    console.log(`🔄 Traitement de la demande ${downloadRequest.id} pour l'utilisateur ${downloadRequest.user_id}`);
    
    // 1. Marquer comme en cours de traitement
    await supabase
      .from('download_requests')
      .update({ 
        status: 'processing',
        error_details: null 
      })
      .eq('id', downloadRequest.id);
    
    // 2. Générer le ZIP
    const prefix = downloadRequest.is_hd ? 'hd-' : '';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = Date.now().toString().slice(-6);
    const zipFileName = `${prefix}images_${dateStr}_${timeStr}_${downloadRequest.id.slice(0, 8)}.zip`;
    
    // 3. Télécharger les images et créer le ZIP
    const { zipData, imageCount } = await createZipFile(downloadRequest, supabase);
    
    // 4. Upload le ZIP vers le stockage Supabase
    const publicUrl = await uploadZipToStorage(zipData, zipFileName, supabase);
    
    // 5. Mettre à jour la demande comme complétée
    const title = imageCount > 1 
      ? `${imageCount} images (${downloadRequest.is_hd ? 'HD' : 'Web'})` 
      : `${downloadRequest.image_title} (${downloadRequest.is_hd ? 'HD' : 'Web'})`;
    
    await supabase
      .from('download_requests')
      .update({
        status: 'ready',
        download_url: publicUrl,
        image_title: title,
        processed_at: new Date().toISOString(),
      })
      .eq('id', downloadRequest.id);
    
    console.log(`✅ Traitement terminé pour la demande ${downloadRequest.id}`);
  } catch (error) {
    console.error(`❌ Échec du traitement pour ${downloadRequest.id}: ${error.message}`);
    
    // En cas d'échec, mettre à jour le statut
    await supabase
      .from('download_requests')
      .update({
        status: 'failed',
        processed_at: new Date().toISOString(),
        error_details: error.message
      })
      .eq('id', downloadRequest.id);
  }
}

/**
 * Récupère les demandes en attente
 */
async function fetchPendingRequests(
  supabase: any,
  config: ProcessConfig
): Promise<DownloadRequest[]> {
  try {
    console.log(`🔍 Recherche de demandes en attente (limite: ${config.max_batch_size})...`);
    
    // Récupérer les demandes en attente, les plus anciennes d'abord
    const { data, error } = await supabase
      .from('download_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(config.max_batch_size);
    
    if (error) throw new Error(`Erreur lors de la récupération des demandes: ${error.message}`);
    
    console.log(`📊 ${data?.length || 0} demandes trouvées en attente`);
    return data || [];
  } catch (error) {
    console.error(`❌ Erreur lors de la recherche de demandes: ${error.message}`);
    return [];
  }
}

/**
 * Point d'entrée principal - exécute le traitement de la file d'attente
 */
async function processQueue(
  config: ProcessConfig = DEFAULT_CONFIG,
  supabase: any
): Promise<{
  processed: number;
  success: number;
  failed: number;
  remaining: number;
}> {
  console.log(`🚀 Démarrage du traitement de la file d'attente (taille ${config.max_batch_size})`);
  
  // Récupérer les demandes en attente
  const pendingRequests = await fetchPendingRequests(supabase, config);
  
  if (pendingRequests.length === 0) {
    console.log("✅ Aucune demande en attente");
    return { processed: 0, success: 0, failed: 0, remaining: 0 };
  }
  
  let success = 0;
  let failed = 0;
  
  // Traiter les demandes séquentiellement pour éviter les problèmes de mémoire
  for (const request of pendingRequests) {
    try {
      await processDownloadRequest(request, supabase);
      success++;
    } catch (error) {
      console.error(`❌ Erreur globale lors du traitement: ${error.message}`);
      failed++;
    }
  }
  
  // Vérifier s'il reste des demandes en attente
  const { count, error } = await supabase
    .from('download_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  const remaining = error ? 0 : (count || 0);
  
  console.log(`📊 Résultats du traitement de la file d'attente:
  - Traitées: ${pendingRequests.length}
  - Succès: ${success}
  - Échecs: ${failed}
  - Restantes: ${remaining}`);
  
  return {
    processed: pendingRequests.length,
    success,
    failed,
    remaining
  };
}

// Gestionnaire des requêtes HTTP
serve(async (req) => {
  // Gérer les requêtes CORS OPTIONS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Méthode non autorisée' }),
        { status: 405, headers: corsHeaders }
      );
    }
    
    // Initialiser le client Supabase avec des clés d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Variables d'environnement Supabase manquantes");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Configuration personnalisée si fournie dans le corps
    let config = DEFAULT_CONFIG;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        config = {
          ...DEFAULT_CONFIG,
          ...body
        };
      } catch {
        // Utiliser la configuration par défaut en cas d'erreur
      }
    }
    
    // Traiter la file d'attente
    const result = await processQueue(config, supabase);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Traitement de la file terminé: ${result.processed} demandes traitées (${result.success} succès, ${result.failed} échecs)`,
        data: result
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`❌ Erreur globale: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur interne: ${error.message}`
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
