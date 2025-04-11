
// Upload to FTP Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { FTPClient } from "https://deno.land/x/ftp@v1.2.0/mod.ts";

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
  fileData: number[]; // Arrived as array when serialized through JSON
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
// Define the public URL base
const PUBLIC_URL_BASE = "https://collabspace.veni6445.odns.fr/lovable-uploads";

// Function to upload a file to the FTP server
async function uploadFileToFTP(fileName: string, fileData: Uint8Array): Promise<string> {
  console.log(`[UPLOAD-FTP] Connecting to FTP server ${FTP_CONFIG.host}:${FTP_CONFIG.port} as ${FTP_CONFIG.user}`);
  console.log(`[UPLOAD-FTP] Upload path: ${UPLOAD_PATH}`);
  console.log(`[UPLOAD-FTP] File name: ${fileName}, Size: ${fileData.length} bytes`);
  
  const ftp = new FTPClient();
  let publicUrl = "";
  
  try {
    // Connect to the FTP server
    await ftp.connect({
      host: FTP_CONFIG.host,
      port: FTP_CONFIG.port,
      user: FTP_CONFIG.user,
      password: FTP_CONFIG.password,
      secure: FTP_CONFIG.secure,
      passvTimeout: 30000, // Extended timeout
    });
    console.log("[UPLOAD-FTP] Connected to FTP server successfully");
    
    // Navigate to the upload directory
    try {
      console.log(`[UPLOAD-FTP] Changing directory to ${UPLOAD_PATH}`);
      await ftp.cd(UPLOAD_PATH);
      console.log("[UPLOAD-FTP] Changed directory successfully");
    } catch (cdErr) {
      console.error(`[UPLOAD-FTP] Error changing to directory ${UPLOAD_PATH}:`, cdErr.message);
      
      // Try to create the directory structure
      console.log("[UPLOAD-FTP] Attempting to create directory structure");
      const pathParts = UPLOAD_PATH.split('/').filter(p => p);
      
      // Navigate to root
      await ftp.cd("/");
      
      // Create path incrementally
      for (const part of pathParts) {
        try {
          console.log(`[UPLOAD-FTP] Trying to navigate to ${part}`);
          await ftp.cd(part);
          console.log(`[UPLOAD-FTP] Successfully navigated to ${part}`);
        } catch (err) {
          console.log(`[UPLOAD-FTP] Creating directory: ${part}`);
          await ftp.mkdir(part);
          console.log(`[UPLOAD-FTP] Created directory: ${part}`);
          await ftp.cd(part);
          console.log(`[UPLOAD-FTP] Navigated to newly created directory: ${part}`);
        }
      }
      console.log(`[UPLOAD-FTP] Directory structure created and navigated to ${UPLOAD_PATH}`);
    }
    
    // Create a local temporary file to upload
    console.log("[UPLOAD-FTP] Creating temporary file for upload");
    const tempFilePath = await Deno.makeTempFile();
    await Deno.writeFile(tempFilePath, fileData);
    console.log(`[UPLOAD-FTP] Temporary file created at ${tempFilePath} with ${fileData.length} bytes`);
    
    // List files in the directory before upload (for debugging)
    try {
      const filesBeforeUpload = await ftp.list(".");
      console.log("[UPLOAD-FTP] Files in directory before upload:", filesBeforeUpload.map(f => f.name));
    } catch (listErr) {
      console.error("[UPLOAD-FTP] Error listing directory before upload:", listErr);
    }
    
    // Upload the file
    console.log(`[UPLOAD-FTP] Uploading file: ${fileName} (${fileData.length} bytes)`);
    try {
      const file = await Deno.open(tempFilePath, { read: true });
      await ftp.uploadFile(file, fileName);
      file.close();
      console.log(`[UPLOAD-FTP] File uploaded successfully: ${fileName}`);
      
      // Verify file exists after upload
      try {
        const filesAfterUpload = await ftp.list(".");
        const uploadedFile = filesAfterUpload.find(f => f.name === fileName);
        if (uploadedFile) {
          console.log(`[UPLOAD-FTP] Verified file exists after upload: ${fileName} (${uploadedFile.size} bytes)`);
        } else {
          console.warn(`[UPLOAD-FTP] File not found in directory after upload: ${fileName}`);
        }
      } catch (listErr) {
        console.error("[UPLOAD-FTP] Error listing directory after upload:", listErr);
      }
    } catch (uploadError) {
      console.error(`[UPLOAD-FTP] Upload error for ${fileName}:`, uploadError);
      throw uploadError;
    }
    
    // Clean up the temporary file
    try {
      await Deno.remove(tempFilePath);
      console.log("[UPLOAD-FTP] Temporary file cleaned up");
    } catch (cleanupError) {
      console.error("[UPLOAD-FTP] Error cleaning up temp file:", cleanupError);
      // Non-fatal, continue
    }
    
    // Construct the public URL
    publicUrl = `${PUBLIC_URL_BASE}/${fileName}`;
    console.log(`[UPLOAD-FTP] Public URL for the file: ${publicUrl}`);
    
  } catch (error) {
    console.error("[UPLOAD-FTP] FTP Error:", error.message);
    if (error.stack) {
      console.error("[UPLOAD-FTP] Stack trace:", error.stack);
    }
    throw new Error(`FTP Upload Error: ${error.message}`);
  } finally {
    // Always close the FTP connection
    try {
      await ftp.close();
      console.log("[UPLOAD-FTP] FTP connection closed");
    } catch (closeError) {
      console.error("[UPLOAD-FTP] Error closing FTP connection:", closeError.message);
    }
  }
  
  return publicUrl;
}

// Serve the function
serve(async (req) => {
  console.log('[UPLOAD-FTP] Upload to FTP function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[UPLOAD-FTP] Handling OPTIONS request (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log(`[UPLOAD-FTP] Method not allowed: ${req.method}`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Parse request body
    const requestData = await req.json();
    const { fileName, fileData } = requestData;
    
    if (!fileName || !fileData) {
      console.log('[UPLOAD-FTP] Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing fileName or fileData' }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`[UPLOAD-FTP] Processing upload request for file: ${fileName}, data length: ${fileData.length}`);
    
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
    console.error('[UPLOAD-FTP] Error processing request:', error);
    if (error.stack) {
      console.error('[UPLOAD-FTP] Stack trace:', error.stack);
    }
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
