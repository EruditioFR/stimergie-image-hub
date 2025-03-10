
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ImageAnalysisResponse {
  tags: string[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: "Image URL is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // For demo purposes, this returns predefined tags
    // In a real application, you would call a vision API here (like Google Cloud Vision, Microsoft Computer Vision, etc.)
    const mockTags = [
      "nature", 
      "landscape", 
      "portrait", 
      "architecture", 
      "technology", 
      "business", 
      "people", 
      "animal", 
      "food", 
      "travel"
    ];
    
    // Select 5-10 random tags from the mock tags
    const numberOfTags = Math.floor(Math.random() * 6) + 5; // 5 to 10 tags
    const selectedTags = [...mockTags]
      .sort(() => 0.5 - Math.random())
      .slice(0, numberOfTags);

    return new Response(
      JSON.stringify({ tags: selectedTags } as ImageAnalysisResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
