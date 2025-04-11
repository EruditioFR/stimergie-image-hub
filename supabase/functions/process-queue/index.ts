
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Interface definitions
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

interface ProcessConfig {
  max_batch_size: number;
  processing_timeout_seconds: number;
}

// Further reduced configuration to address resource limits
const DEFAULT_CONFIG: ProcessConfig = {
  max_batch_size: 1, // Process one request at a time
  processing_timeout_seconds: 120, // 2 minutes timeout (reduced from 3)
};

/**
 * Extremely optimized image fetcher with strict resource limits
 */
async function fetchImageWithRetries(
  url: string,
  retries = 0, // No retries by default to save resources
  delay = 200
): Promise<ArrayBuffer> {
  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 8000); // 8 second timeout (reduced)
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
      signal: abortController.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchImageWithRetries(url, retries - 1, delay * 1.5);
      }
      throw new Error(`HTTP error ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error("Fetch timeout");
    }
    
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchImageWithRetries(url, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

/**
 * Extremely memory-efficient ZIP creation 
 */
async function createZipFile(
  downloadRequest: DownloadRequest,
  supabase: any
): Promise<{ zipData: Uint8Array; imageCount: number }> {
  // Set a strict timeout
  const zipCreationTimeoutId = setTimeout(() => {
    throw new Error("ZIP creation timeout exceeded");
  }, 100000); // 100 seconds timeout (reduced)

  try {
    // Only handle one image at a time to reduce memory usage
    const image = {
      id: downloadRequest.image_id,
      title: downloadRequest.image_title || `image_${downloadRequest.image_id}`,
      url: downloadRequest.image_src
    };
    
    // Create a minimal ZIP object
    const zip = new JSZip();
    const folder = zip.folder("images");
    if (!folder) throw new Error("Unable to create ZIP folder");
    
    try {
      // Download with strict timeout
      const buffer = await fetchImageWithRetries(image.url);
      
      // Use simpler file naming
      const safeName = `image.jpg`;
      folder.file(safeName, buffer);
      
      // Explicitly help garbage collection
      (buffer as any) = null;
    } catch (err) {
      console.error(`Error for image ${image.id}: ${err.message}`);
      throw new Error(`Failed to download image: ${err.message}`);
    }

    // Generate ZIP with minimal compression
    const zipData = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 1 }, // Lowest compression level
    });

    clearTimeout(zipCreationTimeoutId);
    return { zipData, imageCount: 1 };
  } catch (error) {
    clearTimeout(zipCreationTimeoutId);
    console.error(`Error creating ZIP: ${error.message}`);
    throw error;
  }
}

/**
 * Upload ZIP to storage with minimal resource usage
 */
async function uploadZipToStorage(
  zipData: Uint8Array,
  fileName: string,
  supabase: any
): Promise<string> {
  try {
    const { error } = await supabase.storage
      .from('ZIP Downloads')
      .upload(fileName, zipData, {
        contentType: 'application/zip',
        upsert: true,
      });

    if (error) throw new Error(`Upload failed: ${error.message}`);

    // Get the public URL
    const { data, error: publicUrlError } = await supabase.storage
      .from('ZIP Downloads')
      .getPublicUrl(fileName);

    if (publicUrlError || !data?.publicUrl) {
      throw new Error("Failed to generate public URL");
    }
    
    return data.publicUrl;
  } catch (error) {
    console.error(`Upload error: ${error.message}`);
    throw error;
  }
}

/**
 * Process a single download request with strict resource limits
 */
async function processDownloadRequest(
  downloadRequest: DownloadRequest,
  supabase: any
): Promise<void> {
  // Add a strict global timeout
  const timeout = setTimeout(() => {
    throw new Error("Processing timeout exceeded");
  }, 120000); // 2 minutes maximum (reduced)
  
  try {
    // Mark as processing
    await supabase
      .from('download_requests')
      .update({ 
        status: 'processing',
        error_details: null 
      })
      .eq('id', downloadRequest.id);
    
    // Generate simplified file name
    const prefix = downloadRequest.is_hd ? 'hd-' : '';
    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const zipFileName = `${prefix}image_${dateStr}_${downloadRequest.id.slice(0, 8)}.zip`;
    
    // Create the ZIP with optimized settings
    const { zipData, imageCount } = await createZipFile(downloadRequest, supabase);
    
    // Upload the ZIP
    const publicUrl = await uploadZipToStorage(zipData, zipFileName, supabase);
    
    // Mark as completed
    const title = downloadRequest.image_title || `Image (${downloadRequest.is_hd ? 'HD' : 'Web'})`;
    
    await supabase
      .from('download_requests')
      .update({
        status: 'ready',
        download_url: publicUrl,
        image_title: title,
        processed_at: new Date().toISOString(),
      })
      .eq('id', downloadRequest.id);
    
    clearTimeout(timeout);
  } catch (error) {
    clearTimeout(timeout);
    
    console.error(`Processing failed for ${downloadRequest.id}: ${error.message}`);
    
    // Update as failed
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
 * Fetch pending requests with minimal fields - one at a time only
 */
async function fetchPendingRequests(
  supabase: any
): Promise<DownloadRequest[]> {
  try {
    // Only select necessary fields and limit to 1 record always
    const { data, error } = await supabase
      .from('download_requests')
      .select('id, user_id, image_id, image_title, image_src, is_hd, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(1); // Always limit to 1 to reduce resource usage
    
    if (error) throw new Error(`Error fetching requests: ${error.message}`);
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching requests: ${error.message}`);
    return [];
  }
}

/**
 * Main queue processing function with strict resource control
 */
async function processQueue(
  supabase: any
): Promise<{
  processed: number;
  success: number;
  failed: number;
  remaining: number;
}> {
  // Set a strict global timeout
  let isTimedOut = false;
  const queueTimeout = setTimeout(() => {
    isTimedOut = true;
    console.log("Queue processing timeout reached");
  }, 120000); // 2 minutes - reduced to avoid resource limits
  
  try {
    // Get only one pending request at a time
    const pendingRequests = await fetchPendingRequests(supabase);
    
    if (pendingRequests.length === 0) {
      clearTimeout(queueTimeout);
      return { processed: 0, success: 0, failed: 0, remaining: 0 };
    }
    
    let success = 0;
    let failed = 0;
    
    // Process exactly one request
    if (!isTimedOut && pendingRequests.length > 0) {
      try {
        await processDownloadRequest(pendingRequests[0], supabase);
        success++;
      } catch (error) {
        console.error(`Processing error: ${error.message}`);
        failed++;
      }
    }
    
    // Quick count of remaining items
    const { count } = await supabase
      .from('download_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');
    
    clearTimeout(queueTimeout);
    
    return {
      processed: pendingRequests.length,
      success,
      failed,
      remaining: count || 0
    };
  } catch (error) {
    clearTimeout(queueTimeout);
    console.error(`Queue processing error: ${error.message}`);
    
    return {
      processed: 0,
      success: 0,
      failed: 1,
      remaining: -1 // Unable to determine
    };
  }
}

// HTTP server with minimal overhead
serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Process the queue with strict resource constraints
    const result = await processQueue(supabase);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: `Queue processed: ${result.processed} requests (${result.success} success, ${result.failed} failed)`,
        data: result
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error(`Global error: ${error.message}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Internal error: ${error.message}`
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
