import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

interface RequestBody {
  images: {
    id: string;
    url: string;
    title: string;
  }[];
  userId: string;
  isHD: boolean;
}

async function fetchImageWithRetries(url: string, retries = 3, delay = 300): Promise<ArrayBuffer> {
  try {
    const response = await fetch(url, { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchImageWithRetries(url, retries - 1, delay * 2);
      }
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchImageWithRetries(url, retries - 1, delay * 2);
    }
    throw error;
  }
}

async function createZipFile(images: RequestBody["images"], isHD: boolean): Promise<Uint8Array> {
  const zip = new JSZip();
  const folder = zip.folder("images");
  if (!folder) throw new Error("Failed to create ZIP folder");

  const BATCH_SIZE = 5;
  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async image => {
      try {
        const buffer = await fetchImageWithRetries(image.url);
        const name = (image.title || `image_${image.id}`).replace(/[^a-z0-9]/gi, "_").toLowerCase();
        folder.file(`${name}.jpg`, buffer);
      } catch (err) {
        console.error(`Erreur ZIP pour ${image.id} : ${err.message}`);
      }
    }));
  }

  return await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 3 },
  });
}

async function uploadZipToStorage(zipData: Uint8Array, fileName: string, supabase: any): Promise<string> {
  const { error } = await supabase.storage
    .from('ZIP Downloads')
    .upload(fileName, zipData, {
      contentType: 'application/zip',
      upsert: true,
    });

  if (error) throw new Error(`Storage upload failed: ${error.message}`);

  const { data, error: signedUrlError } = await supabase.storage
    .from('ZIP Downloads')
    .createSignedUrl(fileName, 3600); // URL valable 1 heure

  if (signedUrlError || !data?.signedUrl) {
    throw new Error("Failed to generate signed URL");
  }

  return data.signedUrl;
}

async function createDownloadRecord(
  supabase: any,
  userId: string,
  imageId: string,
  imageTitle: string,
  imageUrl: string,
  isHD: boolean
): Promise<string> {
  const { data, error } = await supabase
    .from('download_requests')
    .insert({
      user_id: userId,
      image_id: imageId,
      image_title: imageTitle,
      image_src: imageUrl,
      download_url: '',
      status: 'pending',
      is_hd: isHD
    })
    .select('id')
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data.id;
}

async function updateDownloadRecord(
  supabase: any,
  recordId: string,
  downloadUrl: string,
  status: string = 'ready',
  imageTitle?: string
): Promise<void> {
  const updateData: any = { download_url: downloadUrl, status: status };
  if (imageTitle) updateData.image_title = imageTitle;
  const { error } = await supabase.from('download_requests').update(updateData).eq('id', recordId);
  if (error) throw new Error(`Update failed: ${error.message}`);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
    }

    const { images, userId, isHD }: RequestBody = await req.json();

    if (!userId || !images?.length) {
      return new Response(JSON.stringify({ error: 'Missing userId or images' }), { status: 400, headers: corsHeaders });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const zipFileName = `${isHD ? 'hd-' : ''}images_${dateStr}_${Date.now().toString().slice(-6)}.zip`;

    // ➕ Exécution asynchrone en tâche de fond
    const backgroundTask = async () => {
      try {
        const recordId = await createDownloadRecord(
          supabase,
          userId,
          images[0].id,
          `${images.length} images (${isHD ? 'HD' : 'Web'}) - En traitement`,
          images[0].url,
          isHD
        );

        const zip = await createZipFile(images, isHD);
        const downloadUrl = await uploadZipToStorage(zip, zipFileName, supabase);

        await updateDownloadRecord(
          supabase,
          recordId,
          downloadUrl,
          'ready',
          `${images.length} images (${isHD ? 'HD' : 'Web'})`
        );

        console.log(`[ZIP] Fichier prêt pour ${userId}`);
      } catch (err) {
        console.error('[ZIP] Erreur durant le traitement en tâche de fond :', err);
      }
    };

    try {
      // ✅ Traitement en tâche de fond compatible Deno Deploy
      // @ts-ignore
      Deno.core.opAsync("op_wait_until", backgroundTask());
    } catch {
      console.warn('[ZIP] op_wait_until non supporté, fallback direct');
      await backgroundTask();
    }

    // 🎯 Réponse immédiate au client
    return new Response(JSON.stringify({
      status: 'processing',
      message: 'Votre fichier ZIP est en cours de préparation.',
    }), { headers: corsHeaders });

  } catch (err) {
    console.error('[ZIP] Erreur principale :', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
