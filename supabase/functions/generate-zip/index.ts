
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import JSZip from "https://esm.sh/jszip@3.10.1";

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

// Configuration pour O2Switch
const O2SWITCH_UPLOAD_ENDPOINT = 'https://www.stimergie.fr/upload-zip.php';
const O2SWITCH_API_KEY = 'D5850UGNHB3RY6Z16SIGQCDDQGFQ398F';

async function uploadToO2Switch(zipData: Uint8Array, fileName: string): Promise<string> {
  try {
    console.log(`[O2Switch] Uploading ${fileName} (${Math.round(zipData.byteLength / 1024 / 1024)}MB)...`);
    
    // Créer un Blob à partir des données binaires
    const zipBlob = new Blob([zipData], { type: 'application/zip' });
    
    // Créer un FormData pour l'upload
    const formData = new FormData();
    formData.append('file', zipBlob, fileName);
    
    // Envoyer la requête avec l'authentification
    const response = await fetch(O2SWITCH_UPLOAD_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${O2SWITCH_API_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed with status ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (!result.url) {
      throw new Error("URL not provided in response");
    }
    
    console.log(`[O2Switch] Upload successful: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error('[O2Switch] Error uploading file:', error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }

    // Parse the request body
    const { images, userId, isHD } = await req.json() as RequestBody;
    
    if (!userId || !images?.length) {
      return new Response(
        JSON.stringify({ error: 'Missing userId or images' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create the initial download record
    const { data: recordData, error: recordError } = await supabase
      .from('download_requests')
      .insert({
        user_id: userId,
        image_id: images[0].id,
        image_title: `${images.length} images (${isHD ? 'HD' : 'Web'}) - En attente`,
        image_src: images[0].url,
        status: 'pending',
        is_hd: isHD
      })
      .select('id')
      .single();

    if (recordError) {
      console.error('[ZIP] Error creating record:', recordError.message);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create download record', 
          details: recordError.message 
        }),
        { status: 500, headers: corsHeaders }
      );
    }

    const recordId = recordData.id;
    console.log(`[ZIP] Created download record with ID: ${recordId}`);

    // Generate unique filename with record ID
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const zipFileName = `${isHD ? 'hd-' : ''}images_${dateStr}_${recordId}.zip`;

    // We'll process the ZIP generation and upload in a background task
    // using Edge Runtime waitUntil for Deno Deploy compatibility
    async function backgroundTask() {
      try {
        console.log(`[ZIP] Starting background task to create ZIP for record ${recordId}`);
        
        // Create ZIP file
        const zip = new JSZip();
        const folder = zip.folder("images");
        if (!folder) throw new Error("Failed to create ZIP folder");

        // Process images in batches
        const BATCH_SIZE = 5;
        for (let i = 0; i < images.length; i += BATCH_SIZE) {
          const batch = images.slice(i, i + BATCH_SIZE);
          
          await Promise.all(batch.map(async image => {
            try {
              const response = await fetch(image.url);
              if (!response.ok) throw new Error(`HTTP error ${response.status}`);
              
              const buffer = await response.arrayBuffer();
              const name = (image.title || `image_${image.id}`).replace(/[^a-z0-9]/gi, "_").toLowerCase() + ".jpg";
              folder.file(name, buffer);
              
              console.log(`[ZIP] Added image: ${name}`);
            } catch (err) {
              console.error(`[ZIP] Error processing image ${image.id}:`, err);
            }
          }));
        }

        // Generate ZIP data
        console.log(`[ZIP] Generating ZIP file...`);
        const zipData = await zip.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
          compressionOptions: { level: 3 },
        });
        
        console.log(`[ZIP] ZIP generated, size: ${Math.round(zipData.byteLength / 1024 / 1024)}MB`);

        // Upload to O2Switch
        try {
          const downloadUrl = await uploadToO2Switch(zipData, zipFileName);
          
          // Update record with the URL
          const { error: updateError } = await supabase
            .from('download_requests')
            .update({
              download_url: downloadUrl,
              status: 'ready',
              processed_at: new Date().toISOString(),
              image_title: `${images.length} images (${isHD ? 'HD' : 'Web'})`
            })
            .eq('id', recordId);
            
          if (updateError) {
            console.error(`[ZIP] Error updating record: ${updateError.message}`);
            throw updateError;
          }
          
          console.log(`[ZIP] Record updated with URL: ${downloadUrl}`);
        } catch (uploadErr) {
          console.error(`[ZIP] Upload failed:`, uploadErr);
          
          // Update record with error status
          await supabase
            .from('download_requests')
            .update({
              status: 'expired',
              processed_at: new Date().toISOString(),
              image_title: `Échec - ${images.length} images (${isHD ? 'HD' : 'Web'})`
            })
            .eq('id', recordId);
            
          throw uploadErr;
        }
      } catch (err) {
        console.error('[ZIP] Background task error:', err);
      }
    }

    // Execute the task in the background
    try {
      // Using Deno's Edge Runtime waitUntil to run the task in the background
      // This prevents the function from terminating before the task completes
      // @ts-ignore - Deno Deploy specific feature
      Deno.core.opAsync("op_wait_until", backgroundTask());
    } catch (err) {
      console.warn('[ZIP] op_wait_until not supported, fallback to direct execution');
      // Fallback: start the task but don't wait for it
      backgroundTask().catch(err => console.error('[ZIP] Background task failed:', err));
    }

    // Send immediate response
    return new Response(
      JSON.stringify({
        status: 'processing',
        recordId: recordId,
        message: 'Votre fichier ZIP est en cours de préparation et sera bientôt disponible.',
      }), 
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error('[ZIP] Main function error:', err);
    return new Response(
      JSON.stringify({ 
        error: 'Server error', 
        details: err instanceof Error ? err.message : String(err) 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
