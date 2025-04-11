
// Upload to FTP Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FTP } from "https://deno.land/x/ftp@v1.2.0/mod.ts";

// CORS Headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

// Define request body type
interface RequestBody {
  fileName: string;
  fileData: Uint8Array;
}

// Configuration for FTP
const FTP_CONFIG = {
  host: Deno.env.get("FTP_HOST") || "ftp.veni6445.odns.fr",
  port: parseInt(Deno.env.get("FTP_PORT") || "21"),
  user: Deno.env.get("FTP_USER") || "jbbejot@veni6445.odns.fr",
  password: Deno.env.get("FTP_PASSWORD") || "",
  secure: Deno.env.get("FTP_SECURE") === "true",
};

// Define the upload path
const UPLOAD_PATH = "/collabspace.veni6445.odns.fr/lovable-uploads";

// Function to upload a file to the FTP server
async function uploadFileToFTP(fileName: string, fileData: Uint8Array): Promise<string> {
  console.log(`Connecting to FTP server ${FTP_CONFIG.host}:${FTP_CONFIG.port} as ${FTP_CONFIG.user}`);
  
  const ftp = new FTP();
  let publicUrl = "";
  
  try {
    // Connect to the FTP server
    await ftp.connect(FTP_CONFIG);
    console.log("Connected to FTP server");
    
    // Navigate to the upload directory
    try {
      console.log(`Changing directory to ${UPLOAD_PATH}`);
      await ftp.cd(UPLOAD_PATH);
    } catch (cdErr) {
      console.error(`Error changing to directory ${UPLOAD_PATH}:`, cdErr.message);
      
      // Try to create the directory structure
      console.log("Attempting to create directory structure");
      const pathParts = UPLOAD_PATH.split('/').filter(p => p);
      
      // Navigate to root
      await ftp.cd("/");
      
      // Create path incrementally
      for (const part of pathParts) {
        try {
          await ftp.cd(part);
        } catch (err) {
          console.log(`Creating directory: ${part}`);
          await ftp.mkdir(part);
          await ftp.cd(part);
        }
      }
    }
    
    // Convert Uint8Array to Deno.Reader
    const fileBlob = new Blob([fileData]);
    const fileReader = fileBlob.stream().getReader();
    
    // Create a readable stream from the reader
    const stream = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await fileReader.read();
          if (done) break;
          controller.enqueue(value);
        }
        controller.close();
      }
    });
    
    // Upload the file
    console.log(`Uploading file: ${fileName} (${fileData.length} bytes)`);
    await ftp.uploadStream(stream, fileName);
    console.log(`File uploaded successfully: ${fileName}`);
    
    // Construct the public URL
    publicUrl = `http://collabspace.veni6445.odns.fr/lovable-uploads/${fileName}`;
    console.log(`Public URL for the file: ${publicUrl}`);
    
  } catch (error) {
    console.error("FTP Error:", error.message);
    throw new Error(`FTP Upload Error: ${error.message}`);
  } finally {
    // Always close the FTP connection
    try {
      await ftp.close();
      console.log("FTP connection closed");
    } catch (closeError) {
      console.error("Error closing FTP connection:", closeError.message);
    }
  }
  
  return publicUrl;
}

// Serve the function
serve(async (req) => {
  console.log('Upload to FTP function called');
  
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
    const { fileName, fileData } = requestData;
    
    if (!fileName || !fileData) {
      console.log('Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing fileName or fileData' }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`Processing upload request for file: ${fileName}`);
    
    // Upload the file to FTP
    const publicUrl = await uploadFileToFTP(fileName, new Uint8Array(fileData));
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'File uploaded successfully',
        url: publicUrl
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
