
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

    // Get OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Call OpenAI API to analyze the image
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a helpful image tagging assistant. Generate 5-10 relevant tags for the image URL provided. Return only an array of tags in French, with no additional text or explanation."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Generate tags for this image:" },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        max_tokens: 150
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: "Error calling OpenAI API", details: errorData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    const tagContent = openaiData.choices[0].message.content;
    
    // Parse the tags from the response
    // The response might be in various formats, try to extract an array from it
    let tags: string[] = [];
    try {
      // First attempt: try to parse as JSON directly
      if (tagContent.trim().startsWith('[') && tagContent.trim().endsWith(']')) {
        tags = JSON.parse(tagContent);
      } else {
        // Second attempt: extract words, assuming they are separated by commas or newlines
        tags = tagContent
          .split(/[,\n]/)
          .map((tag: string) => tag.trim())
          .filter((tag: string) => tag.length > 0 && !tag.startsWith('-'))
          .map((tag: string) => tag.replace(/^["'\s•-]+|["'\s•-]+$/g, ''));
      }
      
      // Ensure we have reasonable number of tags (5-10)
      if (tags.length > 10) tags = tags.slice(0, 10);
      if (tags.length < 5) {
        // Add some default tags if we don't have enough
        const defaultTags = ["image", "photo", "media", "visuel", "contenu"];
        tags = [...tags, ...defaultTags.slice(0, 5 - tags.length)];
      }
    } catch (error) {
      console.error("Error parsing tags:", error);
      // Fallback to simple extraction
      tags = tagContent
        .split(/[,\n]/)
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.length > 0);
    }

    return new Response(
      JSON.stringify({ tags }),
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
