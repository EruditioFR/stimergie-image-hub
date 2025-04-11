
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

// Configuration with optimized default values
const DEFAULT_CONFIG: ProcessConfig = {
  max_batch_size: 1, // Process one request at a time to minimize resource usage
  processing_timeout_seconds: 180, // 3 minutes per processing (reduced from 5)
};

/**
 * Fetch image with optimized retry logic
 */
async function fetchImageWithRetries(
  url: string,
  retries = 1, // Reduced to 1 retry (was 2)
  delay = 300
): Promise<ArrayBuffer> {
  try {
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 10000); // 10 second timeout
    
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
 * Creates a ZIP file - completely rewritten for efficiency
 */
async function createZipFile(
  downloadRequest: DownloadRequest,
  supabase: any
): Promise<{ zipData: Uint8Array; imageCount: number }> {
  // Set a reasonable timeout for the entire ZIP creation process
  const zipCreationTimeoutId = setTimeout(() => {
    throw new Error("ZIP creation timeout exceeded");
  }, 180000); // 3 minute timeout

  try {
    let images: { id: string; title: string; url: string }[] = [{
      id: downloadRequest.image_id,
      title: downloadRequest.image_title || `image_${downloadRequest.image_id}`,
      url: downloadRequest.image_src
    }];
    
    // Create a more lightweight ZIP object
    const zip = new JSZip();
    const folder = zip.folder("images");
    if (!folder) throw new Error("Unable to create ZIP folder");

    let successfulImages = 0;
    
    // Process images one at a time to preserve memory
    for (const image of images) {
      try {
        // Enforce timeout per image download
        const buffer = await fetchImageWithRetries(image.url);
        
        // Use simpler, memory-efficient file naming
        const safeName = `image_${successfulImages + 1}.jpg`;
        folder.file(safeName, buffer);
        successfulImages++;
        
        // Free memory explicitly
        (buffer as any) = null;
      } catch (err) {
        console.error(`Error for image ${image.id}: ${err.message}`);
        continue;
      }
    }

    if (successfulImages === 0) {
      throw new Error("No images could be downloaded");
    }

    // Generate ZIP with lower compression for efficiency
    const zipData = await zip.generateAsync({
      type: "uint8array",
      compression: "DEFLATE",
      compressionOptions: { level: 1 }, // Lowest compression level to save CPU
    });

    clearTimeout(zipCreationTimeoutId);
    return { zipData, imageCount: successfulImages };
  } catch (error) {
    clearTimeout(zipCreationTimeoutId);
    console.error(`Error creating ZIP: ${error.message}`);
    throw error;
  }
}

/**
 * Upload ZIP to storage with optimized settings
 */
async function uploadZipToStorage(
  zipData: Uint8Array,
  fileName: string,
  supabase: any
): Promise<string> {
  try {
    // Ensure the bucket exists
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
 * Process a single download request with proper timeouts
 */
async function processDownloadRequest(
  downloadRequest: DownloadRequest,
  supabase: any
): Promise<void> {
  // Add a global timeout for the entire processing function
  const timeout = setTimeout(() => {
    throw new Error("Processing timeout exceeded");
  }, 180000); // 3 minutes maximum
  
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
    const zipFileName = `${prefix}images_${dateStr}_${downloadRequest.id.slice(0, 8)}.zip`;
    
    // Create the ZIP with optimized settings
    const { zipData, imageCount } = await createZipFile(downloadRequest, supabase);
    
    // Upload the ZIP
    const publicUrl = await uploadZipToStorage(zipData, zipFileName, supabase);
    
    // Mark as completed
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
 * Fetch pending requests with minimal fields
 */
async function fetchPendingRequests(
  supabase: any,
  config: ProcessConfig
): Promise<DownloadRequest[]> {
  try {
    // Only select necessary fields to reduce payload size
    const { data, error } = await supabase
      .from('download_requests')
      .select('id, user_id, image_id, image_title, image_src, is_hd, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(config.max_batch_size);
    
    if (error) throw new Error(`Error fetching requests: ${error.message}`);
    
    return data || [];
  } catch (error) {
    console.error(`Error fetching requests: ${error.message}`);
    return [];
  }
}

/**
 * Main queue processing function with resource control
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
  // Set a global timeout for the entire queue processing
  let isTimedOut = false;
  const queueTimeout = setTimeout(() => {
    isTimedOut = true;
    console.log("Queue processing timeout reached");
  }, 230000); // 3 minutes and 50 seconds - just under the 4 minute function limit
  
  try {
    // Get pending requests (limiting to just 1 for lower resource usage)
    const pendingRequests = await fetchPendingRequests(supabase, config);
    
    if (pendingRequests.length === 0) {
      clearTimeout(queueTimeout);
      return { processed: 0, success: 0, failed: 0, remaining: 0 };
    }
    
    let success = 0;
    let failed = 0;
    
    // Process one request at a time
    for (const request of pendingRequests) {
      // Check if we've exceeded our time budget
      if (isTimedOut) {
        console.log("Stopping queue processing due to timeout");
        break;
      }
      
      try {
        await processDownloadRequest(request, supabase);
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

// HTTP server with improved error handling
serve(async (req) => {
  // CORS handling
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Validate request method
    if (req.method !== 'GET' && req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: corsHeaders }
      );
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing environment variables");
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Use minimal configuration
    const config = {
      ...DEFAULT_CONFIG,
      max_batch_size: 1 // Force to 1 to minimize resource usage
    };
    
    // Process the queue with resource constraints
    const result = await processQueue(config, supabase);
    
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
