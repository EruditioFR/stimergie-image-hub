
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

interface RequestBody {
  downloadId: string;
  searchPattern: string;
}

// Configuration O2Switch
const O2SWITCH_PUBLIC_URL_BASE = 'https://www.stimergie.fr/zip-downloads/';

// Helper function to check if file exists on O2Switch
async function checkFileExistsOnO2Switch(fileName: string): Promise<boolean> {
  try {
    const fileUrl = `${O2SWITCH_PUBLIC_URL_BASE}${fileName}`;
    const response = await fetch(fileUrl, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error('Error checking file on O2Switch:', error.message);
    return false;
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
    const { downloadId, searchPattern } = await req.json() as RequestBody;
    
    if (!downloadId || !searchPattern) {
      return new Response(
        JSON.stringify({ success: false, details: 'Missing required parameters' }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if we have a download with this ID
    const { data: downloadData, error: downloadError } = await supabase
      .from('download_requests')
      .select('*')
      .eq('id', downloadId)
      .single();
      
    if (downloadError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          details: `Error fetching download: ${downloadError.message}` 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    if (!downloadData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          details: `No download found with ID: ${downloadId}` 
        }),
        { headers: corsHeaders }
      );
    }
    
    // If the download already has a URL and is ready, return it
    if (downloadData.download_url && downloadData.status === 'ready') {
      console.log(`Download already has URL: ${downloadData.download_url}`);
      
      // Double-check that the file actually exists
      const fileExists = await checkFileExistsOnO2Switch(
        downloadData.download_url.replace(O2SWITCH_PUBLIC_URL_BASE, '')
      );
      
      if (fileExists) {
        return new Response(
          JSON.stringify({ 
            success: true,
            url: downloadData.download_url,
            message: `Download is already ready: ${downloadData.download_url}`
          }),
          { headers: corsHeaders }
        );
      }
    }
    
    // Search for files on O2Switch that match the pattern
    // For O2Switch, we use naming pattern: images_YYYYMMDD_{downloadId}.zip or hd-images_YYYYMMDD_{downloadId}.zip
    const isHD = downloadData.is_hd;
    const prefix = isHD ? 'hd-' : '';
    const fileName = `${prefix}images_*_${downloadId}.zip`;
    
    // Since we can't list files on O2Switch directly from here, 
    // we'll construct the most likely filename and check if it exists
    
    // Extract date from the record's creation timestamp (YYYYMMDD format)
    const createdAt = new Date(downloadData.created_at);
    const dateStr = createdAt.toISOString().split('T')[0].replace(/-/g, '');
    
    // Construct the expected filename
    const expectedFileName = `${prefix}images_${dateStr}_${downloadId}.zip`;
    const fileUrl = `${O2SWITCH_PUBLIC_URL_BASE}${expectedFileName}`;
    
    console.log(`Checking for file: ${fileUrl}`);
    
    // Check if the file exists
    const fileExists = await checkFileExistsOnO2Switch(expectedFileName);
    
    if (!fileExists) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          details: `No file found matching pattern "${fileName}"` 
        }),
        { headers: corsHeaders }
      );
    }
    
    // Update the download_requests record with the URL
    const { error: updateError } = await supabase
      .from('download_requests')
      .update({ 
        download_url: fileUrl,
        status: 'ready',
        processed_at: new Date().toISOString()
      })
      .eq('id', downloadId);
      
    if (updateError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          details: `Error updating record: ${updateError.message}` 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Success!
    return new Response(
      JSON.stringify({ 
        success: true, 
        url: fileUrl,
        message: `Found file and updated record: ${expectedFileName}`
      }),
      { headers: corsHeaders }
    );
    
  } catch (error) {
    console.error('Error in check-download-url function:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        details: `Unexpected error: ${error.message}` 
      }),
      { status: 500, headers: corsHeaders }
    );
  }
});
