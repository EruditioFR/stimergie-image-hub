
// Check Download URL Edge Function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
  downloadId: string;
  searchPattern: string;
}

// Check if file exists in storage
async function checkFileExists(pattern: string, supabase: any): Promise<string | null> {
  try {
    console.log(`[CHECK-URL] Checking for file with pattern: ${pattern}`);
    
    // Search for files with the pattern in Supabase Storage
    const { data: files, error } = await supabase.storage
      .from('ZIP Downloads')
      .list('', {
        search: pattern
      });
    
    if (error) {
      console.error(`[CHECK-URL] Error listing files:`, error);
      return null;
    }
    
    console.log(`[CHECK-URL] Found ${files.length} files matching pattern`);
    
    // Look for exact matches or files containing the pattern
    const matchingFile = files.find(file => 
      file.name === `${pattern}.zip` || 
      file.name === pattern || 
      file.name.startsWith(pattern)
    );
    
    if (matchingFile) {
      console.log(`[CHECK-URL] Found matching file: ${matchingFile.name}`);
      
      // Get URL for the file
      const { data } = supabase.storage
        .from('ZIP Downloads')
        .getPublicUrl(matchingFile.name);
        
      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
    
    console.log(`[CHECK-URL] No matching file found for pattern: ${pattern}`);
    return null;
  } catch (error) {
    console.error('[CHECK-URL] Error in checkFileExists:', error);
    return null;
  }
}

serve(async (req) => {
  console.log('[CHECK-URL] Check download URL function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CHECK-URL] Handling OPTIONS request (CORS preflight)');
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      console.log(`[CHECK-URL] Method not allowed: ${req.method}`);
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Parse request body
    const { downloadId, searchPattern } = await req.json() as RequestBody;
    
    if (!downloadId || !searchPattern) {
      console.log('[CHECK-URL] Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`[CHECK-URL] Checking download URL for ID: ${downloadId}, Pattern: ${searchPattern}`);
    
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('[CHECK-URL] Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    console.log(`[CHECK-URL] Creating Supabase client with URL: ${supabaseUrl.substring(0, 30)}...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if file exists in Supabase Storage
    const fileUrl = await checkFileExists(searchPattern, supabase);
    
    if (fileUrl) {
      // Update the download record with the URL
      console.log(`[CHECK-URL] Updating download record ${downloadId} with URL: ${fileUrl}`);
      const { error } = await supabase
        .from('download_requests')
        .update({ 
          download_url: fileUrl,
          status: 'ready'
        })
        .eq('id', downloadId);
        
      if (error) {
        console.error('[CHECK-URL] Error updating download record:', error);
        throw new Error(`Failed to update download record: ${error.message}`);
      }
      
      console.log('[CHECK-URL] Download record updated successfully');
      
      // Return success with URL
      return new Response(
        JSON.stringify({
          success: true,
          url: fileUrl,
          message: 'URL found and download record updated'
        }),
        { headers: corsHeaders }
      );
    } else {
      console.log('[CHECK-URL] No matching file found for pattern:', searchPattern);
      
      // Return not found response
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No matching file found'
        }),
        { headers: corsHeaders }
      );
    }
    
  } catch (error) {
    console.error('[CHECK-URL] Error processing request:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
