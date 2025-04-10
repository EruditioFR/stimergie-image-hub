
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
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      if (retries > 0 && response.status >= 500) {
        console.log(`Retrying fetch for ${url}, retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchImageWithRetries(url, retries - 1, delay * 2);
      }
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    if (retries > 0) {
      console.log(`Network error fetching ${url}, retrying. Retries left: ${retries}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchImageWithRetries(url, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Process images and create ZIP file
async function createZipFile(images: RequestBody["images"], isHD: boolean): Promise<Uint8Array> {
  console.log(`Creating ZIP with ${images.length} images`);
  const zip = new JSZip();
  const imgFolder = zip.folder("images");
  
  if (!imgFolder) {
    throw new Error("Failed to create images folder in ZIP");
  }

  // Process images in batches to avoid memory issues
  const BATCH_SIZE = 10;
  let processedCount = 0;
  let failedCount = 0;

  for (let i = 0; i < images.length; i += BATCH_SIZE) {
    const batch = images.slice(i, i + BATCH_SIZE);
    const batchPromises = batch.map(async (image) => {
      try {
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
        console.error(`Failed to process image ${image.id}: ${error}`);
        failedCount++;
        return { success: false, id: image.id };
      }
    });

    // Wait for all images in this batch to be processed
    await Promise.all(batchPromises);
  }

  console.log(`ZIP creation: ${processedCount} images processed, ${failedCount} failed`);

  // Generate ZIP with moderate compression
  return await zip.generateAsync({ 
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: {
      level: 5 // Balanced compression level
    }
  });
}

// Upload ZIP to Supabase Storage
async function uploadZipToStorage(zipData: Uint8Array, fileName: string, supabase: any): Promise<string> {
  console.log(`Uploading ZIP file ${fileName} (${zipData.length} bytes)`);
  
  const { data, error } = await supabase
    .storage
    .from('zip-downloads')
    .upload(`public/${fileName}`, zipData, {
      contentType: 'application/zip',
      upsert: false
    });
  
  if (error) {
    console.error('Error uploading ZIP:', error);
    throw new Error(`Failed to upload ZIP: ${error.message}`);
  }
  
  // Create a signed URL that expires in 7 days (604800 seconds)
  const { data: urlData, error: urlError } = await supabase
    .storage
    .from('zip-downloads')
    .createSignedUrl(`public/${fileName}`, 604800);
  
  if (urlError) {
    console.error('Error creating signed URL:', urlError);
    throw new Error(`Failed to create download URL: ${urlError.message}`);
  }
  
  return urlData.signedUrl;
}

// Create a download request record in the database
async function createDownloadRecord(
  supabase: any,
  userId: string,
  imageId: string,
  imageTitle: string,
  imageUrl: string,
  downloadUrl: string,
  isHD: boolean
): Promise<string> {
  const { data, error } = await supabase
    .from('download_requests')
    .insert({
      user_id: userId,
      image_id: imageId,
      image_title: imageTitle,
      image_src: imageUrl,
      download_url: downloadUrl,
      status: 'ready',
      is_hd: isHD
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating download record:', error);
    throw new Error(`Failed to create download record: ${error.message}`);
  }
  
  return data.id;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    const { images, userId, isHD } = requestData;
    
    if (!images || images.length === 0) {
      return new Response(JSON.stringify({ error: 'No images provided' }), { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase credentials');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create timestamp for unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `${isHD ? 'hd-' : ''}images_${timestamp}.zip`;
    
    // We'll process the ZIP creation and upload asynchronously
    // and return a "processing" status to the client immediately
    const processPromise = (async () => {
      try {
        // Create the ZIP file
        const zipData = await createZipFile(images, isHD);
        
        // Upload to storage
        const downloadUrl = await uploadZipToStorage(zipData, zipFileName, supabase);
        
        // Create a download record for each image
        // Using the first image for the main record
        const firstImage = images[0];
        await createDownloadRecord(
          supabase, 
          userId, 
          firstImage.id,
          `${images.length} images (${isHD ? 'HD' : 'Web'})`, 
          firstImage.url,
          downloadUrl,
          isHD
        );
        
        console.log('ZIP processing completed successfully');
      } catch (error) {
        console.error('Error in ZIP processing:', error);
        // We could update the status to 'failed' in the download_requests table here
      }
    })();
    
    // Use waitUntil to continue processing after response is sent
    // This allows for long-running tasks without timing out the request
    EdgeRuntime.waitUntil(processPromise);

    // Return immediate response to client
    return new Response(
      JSON.stringify({
        status: 'processing',
        message: 'Your download is being prepared and will appear in the Downloads page once ready.'
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: corsHeaders }
    );
  }
});
