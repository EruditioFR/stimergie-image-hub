
// Upload to FTP Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Client } from "https://deno.land/x/ftp/mod.ts";

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
  fileData: number[]; // Changed to number[] as it will be an array when serialized through JSON
}

// Configuration for FTP
const FTP_CONFIG = {
  host: Deno.env.get("FTP_HOST") || "ftp.veni6445.odns.fr",
  port: parseInt(Deno.env.get("FTP_PORT") || "21"),
  user: Deno.env.get("FTP_USER") || "jbbejot@veni6445.odns.fr",
  password: Deno.env.get("FTP_PASSWORD") || "Eruditio2013@!",
  secure: Deno.env.get("FTP_SECURE") === "true",
};

// Define the upload path
const UPLOAD_PATH = "/collabspace.veni6445.odns.fr/lovable-uploads";

// Function to upload a file to the FTP server
async function uploadFileToFTP(fileName: string, fileData: Uint8Array): Promise<string> {
  console.log(`Connecting to FTP server ${FTP_CONFIG.host}:${FTP_CONFIG.port} as ${FTP_CONFIG.user}`);
  console.log(`Upload path: ${UPLOAD_PATH}`);
  console.log(`File name: ${fileName}, Size: ${fileData.length} bytes`);
  
  const ftp = new Client();
  let publicUrl = "";
  
  try {
    // Connect to the FTP server
    await ftp.connect({
      host: FTP_CONFIG.host,
      port: FTP_CONFIG.port,
      user: FTP_CONFIG.user,
      password: FTP_CONFIG.password,
      secure: FTP_CONFIG.secure,
    });
    console.log("Connected to FTP server successfully");
    
    // Navigate to the upload directory
    try {
      console.log(`Changing directory to ${UPLOAD_PATH}`);
      await ftp.cd(UPLOAD_PATH);
      console.log("Changed directory successfully");
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
          console.log(`Trying to navigate to ${part}`);
          await ftp.cd(part);
          console.log(`Successfully navigated to ${part}`);
        } catch (err) {
          console.log(`Creating directory: ${part}`);
          await ftp.mkdir(part);
          console.log(`Created directory: ${part}`);
          await ftp.cd(part);
          console.log(`Navigated to newly created directory: ${part}`);
        }
      }
      console.log(`Directory structure created and navigated to ${UPLOAD_PATH}`);
    }
    
    // Create a local temporary file to upload
    console.log("Creating temporary file for upload");
    const tempFilePath = await Deno.makeTempFile();
    await Deno.writeFile(tempFilePath, fileData);
    console.log(`Temporary file created at ${tempFilePath} with ${fileData.length} bytes`);
    
    // Upload the file
    console.log(`Uploading file: ${fileName} (${fileData.length} bytes)`);
    try {
      const fileHandle = await Deno.open(tempFilePath);
      await ftp.upload(fileHandle, fileName);
      fileHandle.close();
      console.log(`File uploaded successfully: ${fileName}`);
    } catch (uploadError) {
      console.error(`Upload error for ${fileName}:`, uploadError);
      throw uploadError;
    }
    
    // Clean up the temporary file
    try {
      await Deno.remove(tempFilePath);
      console.log("Temporary file cleaned up");
    } catch (cleanupError) {
      console.error("Error cleaning up temp file:", cleanupError);
      // Non-fatal, continue
    }
    
    // Construct the public URL
    publicUrl = `http://collabspace.veni6445.odns.fr/lovable-uploads/${fileName}`;
    console.log(`Public URL for the file: ${publicUrl}`);
    
  } catch (error) {
    console.error("FTP Error:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
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
    const requestData = await req.json();
    const { fileName, fileData } = requestData;
    
    if (!fileName || !fileData) {
      console.log('Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing fileName or fileData' }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`Processing upload request for file: ${fileName}, data length: ${fileData.length}`);
    
    // Convert the array back to Uint8Array
    const binaryData = new Uint8Array(fileData);
    
    // Upload the file to FTP
    const publicUrl = await uploadFileToFTP(fileName, binaryData);
    
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
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
