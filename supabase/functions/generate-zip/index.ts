
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
    console.log(`Fetching image from URL: ${url.substring(0, 50)}...`);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      
      if (retries > 0 && response.status >= 500) {
        console.log(`Retrying fetch, retries left: ${retries}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchImageWithRetries(url, retries - 1, delay * 2);
      }
      throw new Error(`Failed to fetch image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    console.log(`Image fetched successfully, size: ${buffer.byteLength} bytes`);
    return buffer;
  } catch (error) {
    console.error(`Network error fetching ${url.substring(0, 30)}...: ${error.message}`);
    
    if (retries > 0) {
      console.log(`Network error, retrying. Retries left: ${retries}`);
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
    console.log(`Processing batch ${i/BATCH_SIZE + 1} of ${Math.ceil(images.length/BATCH_SIZE)}`);
    
    const batchPromises = batch.map(async (image) => {
      try {
        console.log(`Processing image ${image.id}: ${image.title}`);
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
        console.error(`Failed to process image ${image.id}: ${error.message}`);
        failedCount++;
        return { success: false, id: image.id };
      }
    });

    // Wait for all images in this batch to be processed
    await Promise.all(batchPromises);
  }

  console.log(`ZIP creation: ${processedCount} images processed, ${failedCount} failed`);

  // Generate ZIP with moderate compression
  console.log('Generating ZIP file...');
  const zipData = await zip.generateAsync({ 
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: {
      level: 5 // Balanced compression level
    }
  });
  
  console.log(`ZIP generated, size: ${zipData.length} bytes`);
  return zipData;
}

// Upload ZIP to Supabase Storage
async function uploadZipToStorage(zipData: Uint8Array, fileName: string, supabase: any): Promise<string> {
  console.log(`Uploading ZIP file ${fileName} (${zipData.length} bytes)`);
  
  try {
    console.log(`Storage bucket target: zip-downloads/public/${fileName}`);
    
    // Make sure the bucket exists before attempting upload
    try {
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('zip-downloads');
      
      if (bucketError) {
        console.error('Error checking bucket:', bucketError);
        console.log('Will try to create the bucket zip-downloads');
        
        const { data: createData, error: createError } = await supabase
          .storage
          .createBucket('zip-downloads', {
            public: false,
            fileSizeLimit: 52428800, // 50MB
          });
        
        if (createError) {
          console.error('Error creating bucket:', createError);
        } else {
          console.log('Bucket created successfully:', createData);
        }
      } else {
        console.log('Bucket exists:', bucketData);
      }
    } catch (bucketCheckError) {
      console.error('Exception checking bucket:', bucketCheckError);
    }
    
    // Upload the file
    const { data, error } = await supabase
      .storage
      .from('zip-downloads')
      .upload(`public/${fileName}`, zipData, {
        contentType: 'application/zip',
        upsert: true 
      });
    
    if (error) {
      console.error('Error uploading ZIP:', error);
      throw new Error(`Failed to upload ZIP: ${error.message || 'Unknown error'}`);
    }
    
    console.log('ZIP upload successful, generating signed URL');
    console.log('Upload data:', data);
    
    // Create a signed URL that expires in 7 days (604800 seconds)
    const { data: urlData, error: urlError } = await supabase
      .storage
      .from('zip-downloads')
      .createSignedUrl(`public/${fileName}`, 604800);
    
    if (urlError) {
      console.error('Error creating signed URL:', urlError);
      throw new Error(`Failed to create download URL: ${urlError.message || 'Unknown error'}`);
    }
    
    if (!urlData || !urlData.signedUrl) {
      console.error('No signed URL returned from storage');
      throw new Error('Failed to get download URL: No URL was returned');
    }
    
    console.log(`Signed URL created successfully: ${urlData.signedUrl.substring(0, 50)}...`);
    return urlData.signedUrl;
  } catch (error) {
    console.error('Error in uploadZipToStorage:', error);
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
  console.log(`Creating download record for user ${userId}`, {
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
      console.error('Error creating download record:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to create download record: ${error.message}`);
    }
    
    console.log(`Download record created with ID: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('Error in createDownloadRecord:', error);
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
  console.log(`Updating download record ${recordId}`, {
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
      console.error('Error updating download record:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      throw new Error(`Failed to update download record: ${error.message}`);
    }
    
    console.log(`Download record ${recordId} updated successfully to ${status}`);
  } catch (error) {
    console.error('Error in updateDownloadRecord:', error);
    throw error;
  }
}

serve(async (req) => {
  console.log('Generate ZIP function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS request (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log(`Method not allowed: ${req.method}`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Parse request body
    const requestData: RequestBody = await req.json();
    const { images, userId, isHD } = requestData;
    
    console.log(`Request received for user ${userId}:`, {
      imageCount: images.length,
      isHD: isHD
    });
    
    if (!userId) {
      console.log('Missing userId in request');
      return new Response(JSON.stringify({ error: 'Missing userId' }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    if (!images || images.length === 0) {
      console.log('No images provided in request');
      return new Response(JSON.stringify({ error: 'No images provided' }), { 
        status: 400,
        headers: corsHeaders
      });
    }

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    console.log(`Creating Supabase client with URL: ${supabaseUrl.substring(0, 30)}...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Create timestamp for unique filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFileName = `${isHD ? 'hd-' : ''}images_${timestamp}.zip`;
    
    // We'll process the ZIP creation and upload asynchronously
    // and return a "processing" status to the client immediately
    const processPromise = (async () => {
      try {
        console.log("Starting ZIP processing in background");
        
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
        
        console.log(`Created pending download record: ${pendingRecord}`);
        
        try {
          // Create the ZIP file
          const zipData = await createZipFile(images, isHD);
          
          // Upload to storage and get the download URL
          const downloadUrl = await uploadZipToStorage(zipData, zipFileName, supabase);
          
          console.log(`ZIP uploaded, download URL: ${downloadUrl.substring(0, 50)}...`);
          
          // Update the download record with the ready status and URL
          await updateDownloadRecord(
            supabase,
            pendingRecord,
            downloadUrl,
            'ready',
            `${images.length} images (${isHD ? 'HD' : 'Web'})`
          );
          
          console.log(`Download record ${pendingRecord} updated to ready status with URL`);
        } catch (processingError) {
          console.error('Error in ZIP processing:', processingError);
          console.error('Stack trace:', processingError.stack);
          
          // Update the download record with failed status
          await updateDownloadRecord(
            supabase,
            pendingRecord,
            '', // Empty URL since processing failed
            'expired', // Using expired as a failure status
            `Failed: ${images.length} images (${isHD ? 'HD' : 'Web'})`
          );
          
          console.log(`Download record ${pendingRecord} updated to error status`);
        }
      } catch (outerError) {
        console.error('Fatal error in ZIP processing:', outerError);
        console.error('Stack trace:', outerError.stack);
      }
    })();
    
    // Use waitUntil to continue processing after response is sent
    try {
      // @ts-ignore - EdgeRuntime.waitUntil is available in Deno Deploy
      EdgeRuntime.waitUntil(processPromise);
    } catch (waitError) {
      console.error('Warning: EdgeRuntime.waitUntil not available:', waitError);
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
    console.error('Error processing request:', error);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
