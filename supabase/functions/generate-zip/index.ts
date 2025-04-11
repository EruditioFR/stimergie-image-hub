
// Generate ZIP Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

// CORS Headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Define request body type
interface RequestBody {
  images: {
    id: string;
    url: string;
    title: string;
  }[];
  userId: string;
  isHD: boolean;
}

// Fetch image with retries
async function fetchImageWithRetries(url: string, retries = 3, delay = 300): Promise<ArrayBuffer> {
  try {
    console.log(`[GENERATE-ZIP] Fetching image from URL: ${url.substring(0, 50)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`[GENERATE-ZIP] Failed to fetch image: ${response.status} ${response.statusText}`);
      
      if (retries > 0 && response.status >= 500) {
        console.log(`[GENERATE-ZIP] Retrying fetch, retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchImageWithRetries(url, retries - 1, delay * 2);
      }
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    console.log(`[GENERATE-ZIP] Image fetched successfully, size: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.error(`[GENERATE-ZIP] Network error fetching ${url.substring(0, 30)}...: ${error.message}`);
    
    if (retries > 0) {
      console.log(`[GENERATE-ZIP] Network error, retrying. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchImageWithRetries(url, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Process images and create ZIP file
async function createZipFile(images: RequestBody["images"], isHD: boolean): Promise<Uint8Array> {
  console.log(`[GENERATE-ZIP] Creating ZIP with ${images.length} images`);
  const zip = new JSZip();
  const imgFolder = zip.folder("images");
  
  if (!imgFolder) {
    throw new Error("Failed to create images folder in ZIP");
  }

  // Process images in batches to avoid memory issues
  const BATCH_SIZE = 5; // Smaller batch size to avoid memory issues
  let processedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    console.log(`[GENERATE-ZIP] Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(images.length/BATCH_SIZE)}`);
    
    const batchPromises = batch.map(async (image) => {
      try {
        console.log(`[GENERATE-ZIP] Processing image ${image.id}: ${image.title}`);
        const imageData = await fetchImageWithRetries(image.url);
        
        // Create a safe filename
        const safeTitle = image.title 
          ? image.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() 
          : `image_${image.id}`;
        
        // Add to ZIP
        imgFolder.file(`${safeTitle}.jpg`, imageData);
        processedCount++;
        return { success: true, id: image.id };
      } catch (error) {
        console.error(`[GENERATE-ZIP] Failed to process image ${image.id}: ${error.message}`);
        failedCount++;
        return { success: false, id: image.id };
      }
    });

    // Wait for all images in this batch to be processed
    await Promise.all(batchPromises);
  }

  console.log(`[GENERATE-ZIP] ZIP creation: ${processedCount} images processed, ${failedCount} failed`);

  // Generate ZIP with moderate compression
  console.log('[GENERATE-ZIP] Generating ZIP file...');
  const zipData = await zip.generateAsync({ 
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: {
      level: 3 // Lower compression level to speed up processing
    }
  });
  
  console.log(`[GENERATE-ZIP] ZIP generated, size: ${zipData.length} bytes`);
  return zipData;
}

// Upload ZIP to FTP server
async function uploadZipToFTP(zipData: Uint8Array, fileName: string, supabaseUrl: string, serviceRoleKey: string): Promise<string> {
  console.log(`[GENERATE-ZIP] Uploading ZIP file ${fileName} to FTP server (${zipData.length} bytes)`);
  
  try {
    // Since we're sending binary data through JSON, we need to convert to an array of numbers
    console.log(`[GENERATE-ZIP] Converting ZIP to array for JSON serialization...`);
    const zipDataArray = Array.from(zipData);
    console.log(`[GENERATE-ZIP] Converted ZIP to array. Length: ${zipDataArray.length}`);
    
    // Log the first few elements of the array to verify data format
    console.log(`[GENERATE-ZIP] First 10 byte values:`, zipDataArray.slice(0, 10));
    
    // Call the upload-to-ftp function
    console.log(`[GENERATE-ZIP] Calling upload-to-ftp function with file: ${fileName}`);
    const response = await fetch(`${supabaseUrl}/functions/v1/upload-to-ftp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceRoleKey}`
      },
      body: JSON.stringify({
        fileName,
        fileData: zipDataArray
      })
    });

    // Log detailed response information
    console.log(`[GENERATE-ZIP] FTP upload response status:`, response.status, response.statusText);
    
    // Check if the call was successful
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GENERATE-ZIP] Error from FTP upload function: ${response.status} - ${errorText}`);
      throw new Error(`Failed to upload ZIP to FTP: ${response.status}`);
    }

    const result = await response.json();
    
    // Log the full response from the FTP function
    console.log(`[GENERATE-ZIP] FTP upload function response:`, JSON.stringify(result));
    
    if (!result.url) {
      console.error('[GENERATE-ZIP] No URL returned from FTP upload function');
      throw new Error('Failed to get download URL from FTP server');
    }
    
    console.log(`[GENERATE-ZIP] File uploaded to FTP successfully. URL: ${result.url}`);
    return result.url;
  } catch (error) {
    console.error('[GENERATE-ZIP] Error in uploadZipToFTP:', error);
    console.error('[GENERATE-ZIP] Stack trace:', error.stack);
    throw error;
  }
}

// Create a download request record in the database
async function createDownloadRecord(
  supabase: any,
  userId: string,
  imageId: string,
  imageTitle: string,
  imageUrl: string,
  downloadUrl: string,
  isHD: boolean,
  status: string = 'pending'
): Promise<string> {
  console.log(`[GENERATE-ZIP] Creating download record for user ${userId}`);
  console.log('[GENERATE-ZIP] Record data:', {
    user_id: userId,
    image_id: imageId,
    image_title: imageTitle,
    image_src: imageUrl,
    download_url: downloadUrl,
    status: status,
    is_hd: isHD
  });
  
  try {
    const { data, error } = await supabase
      .from('download_requests')
      .insert({
        user_id: userId,
        image_id: imageId,
        image_title: imageTitle,
        image_src: imageUrl,
        download_url: downloadUrl,
        status: status,
        is_hd: isHD
      })
      .select('id')
      .single();
    
    if (error) {
      console.error('[GENERATE-ZIP] Error creating download record:', error);
      console.error('[GENERATE-ZIP] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to create download record: ${error.message}`);
    }
    
    console.log(`[GENERATE-ZIP] Download record created with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('[GENERATE-ZIP] Error in createDownloadRecord:', error);
    console.error('[GENERATE-ZIP] Stack trace:', error.stack);
    throw error;
  }
}

// Update an existing download record with new data
async function updateDownloadRecord(
  supabase: any,
  recordId: string,
  downloadUrl: string,
  status: string = 'ready',
  imageTitle?: string
): Promise<void> {
  console.log(`[GENERATE-ZIP] Updating download record ${recordId}`, {
    download_url: downloadUrl.substring(0, 50) + "...",
    status: status,
    ...(imageTitle && { image_title: imageTitle })
  });
  
  try {
    const updateData: any = { 
      download_url: downloadUrl,
      status: status
    };
    
    if (imageTitle) {
      updateData.image_title = imageTitle;
    }
    
    const { error } = await supabase
      .from('download_requests')
      .update(updateData)
      .eq('id', recordId);
    
    if (error) {
      console.error('[GENERATE-ZIP] Error updating download record:', error);
      console.error('[GENERATE-ZIP] Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to update download record: ${error.message}`);
    }
    
    console.log(`[GENERATE-ZIP] Download record ${recordId} updated successfully to ${status}`);
  } catch (error) {
    console.error('[GENERATE-ZIP] Error in updateDownloadRecord:', error);
    console.error('[GENERATE-ZIP] Stack trace:', error.stack);
    throw error;
  }
}

serve(async (req) => {
  console.log('[GENERATE-ZIP] Generate ZIP function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[GENERATE-ZIP] Handling OPTIONS request (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log(`[GENERATE-ZIP] Method not allowed: ${req.method}`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    const { images, userId, isHD } = requestData;
    
    console.log(`[GENERATE-ZIP] Request received for user ${userId}:`, {
      imageCount: images.length,
      isHD: isHD
    });
    
    if (!userId) {
      console.log('[GENERATE-ZIP] Missing userId in request');
      return new Response(JSON.stringify({ error: 'Missing userId' }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    if (!images || images.length === 0) {
      console.log('[GENERATE-ZIP] No images provided in request');
      return new Response(JSON.stringify({ error: 'No images provided' }), { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[GENERATE-ZIP] Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    console.log(`[GENERATE-ZIP] Creating Supabase client with URL: ${supabaseUrl.substring(0, 30)}...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create timestamp for unique filename - use date without time for better file naming
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const zipFileName = `${isHD ? 'hd-' : ''}images_${dateStr}_${Date.now().toString().slice(-6)}.zip`;
    
    // We'll process the ZIP creation and upload asynchronously
    // and return a "processing" status to the client immediately
    const processPromise = (async () => {
      try {
        console.log("[GENERATE-ZIP] Starting ZIP processing in background");
        
        // First, create a pending download record
        const pendingRecord = await createDownloadRecord(
          supabase,
          userId,
          images[0].id,
          `${images.length} images (${isHD ? 'HD' : 'Web'}) - Processing`,
          images[0].url,
          '', // Empty URL while processing
          isHD
        );
        
        console.log(`[GENERATE-ZIP] Created pending download record: ${pendingRecord}`);
        
        try {
          // Create the ZIP file with fixed batch size to avoid memory issues
          const zipData = await createZipFile(images, isHD);
          console.log(`[GENERATE-ZIP] ZIP file created successfully, size: ${zipData.length} bytes`);
          
          // Upload to FTP server and get the download URL
          const downloadUrl = await uploadZipToFTP(zipData, zipFileName, supabaseUrl, supabaseServiceKey);
          
          console.log(`[GENERATE-ZIP] ZIP uploaded to FTP successfully, download URL: ${downloadUrl}`);
          
          // Update the download record with the ready status and URL
          await updateDownloadRecord(
            supabase,
            pendingRecord,
            downloadUrl,
            'ready',
            `${images.length} images (${isHD ? 'HD' : 'Web'})`
          );
          
          console.log(`[GENERATE-ZIP] Download record ${pendingRecord} updated to ready status with URL`);
        } catch (processingError) {
          console.error('[GENERATE-ZIP] Error in ZIP processing:', processingError);
          console.error('[GENERATE-ZIP] Stack trace:', processingError.stack);
          
          // Update the download record with failed status
          await updateDownloadRecord(
            supabase,
            pendingRecord,
            '', // Empty URL since processing failed
            'expired', // Using expired as a failure status
            `Failed: ${images.length} images (${isHD ? 'HD' : 'Web'})`
          );
          
          console.log(`[GENERATE-ZIP] Download record ${pendingRecord} updated to error status`);
        }
      } catch (outerError) {
        console.error('[GENERATE-ZIP] Fatal error in ZIP processing:', outerError);
        console.error('[GENERATE-ZIP] Stack trace:', outerError.stack);
      }
    })();
    
    // Use waitUntil to continue processing after response is sent
    try {
      // @ts-ignore - Deno.core.opAsync is available in Deno Deploy
      Deno.core.opAsync("op_wait_until", processPromise);
    } catch (waitError) {
      console.error('[GENERATE-ZIP] Warning: waitUntil not available:', waitError);
      // If waitUntil is not available, we'll just let the promise run
      // This could potentially be cut off if the runtime terminates too early
    }

    // Return immediate response to client
    return new Response(
      JSON.stringify({
        status: 'processing',
        message: 'Your download is being prepared and will appear in the Downloads page once ready.'
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('[GENERATE-ZIP] Error processing request:', error);
    console.error('[GENERATE-ZIP] Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
