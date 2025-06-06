
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { imageBase64 } = await req.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image data is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log("Received request to analyze image with base64 data");

    // Get OpenAI API key from environment variables
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log("Calling OpenAI API...");
    
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
            content: "You are a helpful image tagging assistant. Generate 5-10 relevant tags for the image provided. Return only an array of tags in French, with no additional text or explanation."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Generate tags for this image:" },
              { 
                type: "image_url", 
                image_url: { 
                  url: `data:image/jpeg;base64,${imageBase64}`
                } 
              }
            ]
          }
        ],
        max_tokens: 150
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error("OpenAI API error:", JSON.stringify(errorData));
      return new Response(
        JSON.stringify({ error: "Error calling OpenAI API", details: errorData }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    const openaiData = await openaiResponse.json();
    console.log("OpenAI response received:", JSON.stringify(openaiData).substring(0, 200) + "...");
    
    const tagContent = openaiData.choices[0].message.content;
    console.log("Raw tag content:", tagContent);
    
    // Parse the tags from the response
    // The response might be in various formats, try to extract an array from it
    let tags = [];
    try {
      // First attempt: try to parse as JSON directly
      if (tagContent.trim().startsWith('[') && tagContent.trim().endsWith(']')) {
        tags = JSON.parse(tagContent);
      } else {
        // Second attempt: extract words, assuming they are separated by commas or newlines
        tags = tagContent
          .split(/[,\n]/)
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0 && !tag.startsWith('-'))
          .map((tag) => tag.replace(/^["'\s•-]+|["'\s•-]+$/g, ''));
      }
      
      // Ensure we have reasonable number of tags (5-10)
      if (tags.length > 10) tags = tags.slice(0, 10);
      if (tags.length < 5) {
        // Add some default tags if we don't have enough
        const defaultTags = ["image", "photo", "media", "visuel", "contenu"];
        tags = [...tags, ...defaultTags.slice(0, 5 - tags.length)];
      }
      
      console.log("Final processed tags:", tags);
    } catch (error) {
      console.error("Error parsing tags:", error);
      // Fallback to simple extraction
      tags = tagContent
        .split(/[,\n]/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
    }

    return new Response(
      JSON.stringify({ tags }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error.stack || error.message || error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
