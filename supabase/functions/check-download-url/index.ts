
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

// Helper function to ensure the bucket exists with proper policies
async function ensureZipBucketExists(supabase: any): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error checking buckets:', bucketsError.message);
      return;
    }
    
    const zipBucket = buckets?.find((b: any) => b.name === "zip_downloads" || b.name === "ZIP Downloads");
    
    if (!zipBucket) {
      // Create the bucket if it doesn't exist
      console.log('Creating zip_downloads bucket');
      const { error: createError } = await supabase.storage.createBucket('zip_downloads', { 
        public: true,
        fileSizeLimit: 50 * 1024 * 1024 // 50MB
      });
      
      if (createError) {
        console.error('Failed to create bucket:', createError.message);
        return;
      }
    }
    
    console.log('zip_downloads bucket verified');
  } catch (error) {
    console.error('Error in ensureZipBucketExists:', error.message);
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
    
    // Ensure bucket exists and has proper policies
    await ensureZipBucketExists(supabase);
    
    // List files in the bucket that match the pattern
    const { data: fileList, error: fileListError } = await supabase.storage
      .from('zip_downloads')
      .list();
      
    if (fileListError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          details: `Error listing files: ${fileListError.message}` 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    console.log(`Found ${fileList?.length || 0} files in zip_downloads bucket`);
    
    // Find files that match the pattern
    const matchingFiles = fileList?.filter(file => 
      file.name.toLowerCase().includes(searchPattern.toLowerCase())
    ) || [];
    
    console.log(`Found ${matchingFiles.length} files matching pattern "${searchPattern}"`);
    
    if (matchingFiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          details: `No files found matching pattern "${searchPattern}"` 
        }),
        { headers: corsHeaders }
      );
    }
    
    // Get the most recently modified file
    const latestFile = matchingFiles[0]; // Assuming files are sorted by date
    
    // Generate a public URL for the file
    const { data: urlData, error: urlError } = await supabase.storage
      .from('zip_downloads')
      .getPublicUrl(latestFile.name);
      
    if (urlError) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          details: `Error generating URL: ${urlError.message}` 
        }),
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Update the download_requests record with the URL
    const { error: updateError } = await supabase
      .from('download_requests')
      .update({ 
        download_url: urlData.publicUrl,
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
        url: urlData.publicUrl,
        message: `Found file and updated record: ${latestFile.name}`
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
