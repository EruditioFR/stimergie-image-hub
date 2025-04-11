
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

// Check if file exists with pattern matching
async function checkFileExists(pattern: string): Promise<string | null> {
  try {
    console.log(`Checking for file with pattern: ${pattern}`);
    
    // Construct the base URL for the FTP hosted content
    const baseUrl = 'http://collabspace.veni6445.odns.fr/lovable-uploads';
    
    // Since we can't list directory contents directly, we'll try making a HEAD request
    // to check if the file exists
    
    const currentDate = new Date();
    // Try the current date and a few days back, in case there was a delay in upload
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date();
      checkDate.setDate(currentDate.getDate() - i);
      
      const dateStr = checkDate.toISOString().split('T')[0].replace(/-/g, '');
      const url = `${baseUrl}/${pattern}-${dateStr}.zip`;
      
      console.log(`Checking URL: ${url}`);
      
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          console.log(`File found at: ${url}`);
          return url;
        }
      } catch (err) {
        console.log(`Error checking ${url}:`, err.message);
        // Continue to next date
      }
    }
    
    // If we didn't find a file with a specific date, try without date
    const url = `${baseUrl}/${pattern}.zip`;
    try {
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        console.log(`File found at: ${url}`);
        return url;
      }
    } catch (err) {
      console.log(`Error checking ${url}:`, err.message);
    }
    
    console.log('No matching file found');
    return null;
  } catch (error) {
    console.error('Error in checkFileExists:', error);
    return null;
  }
}

serve(async (req) => {
  console.log('Check download URL function called');
  
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
    const { downloadId, searchPattern } = await req.json() as RequestBody;
    
    if (!downloadId || !searchPattern) {
      console.log('Missing required fields');
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { 
        status: 400,
        headers: corsHeaders
      });
    }
    
    console.log(`Checking download URL for ID: ${downloadId}, Pattern: ${searchPattern}`);
    
    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase credentials');
      throw new Error('Missing Supabase credentials');
    }
    
    console.log(`Creating Supabase client with URL: ${supabaseUrl.substring(0, 30)}...`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if file exists
    const fileUrl = await checkFileExists(searchPattern);
    
    if (fileUrl) {
      // Update the download record with the URL
      console.log(`Updating download record ${downloadId} with URL: ${fileUrl}`);
      const { error } = await supabase
        .from('download_requests')
        .update({ 
          download_url: fileUrl,
          status: 'ready'
        })
        .eq('id', downloadId);
        
      if (error) {
        console.error('Error updating download record:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        throw new Error(`Failed to update download record: ${error.message}`);
      }
      
      console.log('Download record updated successfully');
      
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
      console.log('No matching file found for pattern:', searchPattern);
      
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
    console.error('Error processing request:', error);
    console.error('Stack trace:', error.stack);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: corsHeaders }
    );
  }
});
