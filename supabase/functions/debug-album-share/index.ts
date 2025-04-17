
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing environment variables for Supabase');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get share key from request
    const { shareKey } = await req.json();
    
    if (!shareKey) {
      return new Response(
        JSON.stringify({ error: 'Share key is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Directly query the albums table
    const { data: albumData, error: albumError } = await supabase
      .from('albums')
      .select('*')
      .eq('share_key', shareKey)
      .single();
    
    if (albumError) {
      console.error('Error fetching album:', albumError);
      return new Response(
        JSON.stringify({ error: albumError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    if (!albumData) {
      return new Response(
        JSON.stringify({ error: 'Album not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }
    
    // Get album images
    const { data: imagesData, error: imagesError } = await supabase
      .from('album_images')
      .select('image_id')
      .eq('album_id', albumData.id);
    
    if (imagesError) {
      console.error('Error fetching album images:', imagesError);
      return new Response(
        JSON.stringify({ error: imagesError.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }
    
    const imageIds = imagesData.map(item => item.image_id);
    
    let images = [];
    if (imageIds.length > 0) {
      const { data: fullImagesData, error: fullImagesError } = await supabase
        .from('images')
        .select('*')
        .in('id', imageIds);
      
      if (fullImagesError) {
        console.error('Error fetching full image data:', fullImagesError);
      } else {
        images = fullImagesData;
      }
    }
    
    // Return album with images
    const result = {
      ...albumData,
      images: images
    };
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
