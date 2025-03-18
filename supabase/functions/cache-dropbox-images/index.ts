
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7'
import { fetchImageAsBlob } from './imageUtils.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cache settings
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 // 7 days in seconds

// Create Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Handle CORS preflight requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { immediate } = await req.json()
    
    // Get all images with url_miniature (Dropbox images)
    const { data: images, error } = await supabase
      .from('images')
      .select('id, url_miniature, title')
      .not('url_miniature', 'is', null)
    
    if (error) {
      throw error
    }

    console.log(`Found ${images?.length || 0} Dropbox images to cache`)

    // Function to cache a single image
    async function cacheImage(imageData: any) {
      try {
        if (!imageData.url_miniature) return false
        
        // Convert Dropbox URL to direct download URL
        const downloadUrl = getDropboxDownloadUrl(imageData.url_miniature)
        
        // Fetch the image and get the blob
        const imageBlob = await fetchImageAsBlob(downloadUrl)
        
        if (!imageBlob) {
          console.error(`Failed to download image: ${imageData.title || 'Untitled'}`)
          return false
        }
        
        console.log(`Successfully cached image: ${imageData.title || 'Untitled'}`)
        return true
      } catch (e) {
        console.error(`Error caching image ${imageData.id}:`, e)
        return false
      }
    }

    // Process immediately if requested (background task)
    if (immediate) {
      // Start background processing
      const processTask = async () => {
        console.log("Starting background caching process...")
        let successCount = 0
        let failCount = 0
        
        // Process images in batches of 5 to avoid overloading
        const batchSize = 5
        for (let i = 0; i < (images?.length || 0); i += batchSize) {
          const batch = images?.slice(i, i + batchSize) || []
          
          // Process batch in parallel
          const results = await Promise.all(
            batch.map(img => cacheImage(img))
          )
          
          // Count results
          successCount += results.filter(r => r).length
          failCount += results.filter(r => !r).length
          
          // Small delay between batches
          if (i + batchSize < (images?.length || 0)) {
            await new Promise(resolve => setTimeout(resolve, 1000))
          }
        }
        
        console.log(`Caching complete: ${successCount} successful, ${failCount} failed`)
      }
      
      // Use EdgeRuntime.waitUntil for background processing
      EdgeRuntime.waitUntil(processTask())
      
      return new Response(
        JSON.stringify({ message: `Started caching ${images?.length || 0} images in the background` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    } else {
      // Run a sample of 3 images synchronously for the response
      const sampleImages = images?.slice(0, 3) || []
      const sampleResults = await Promise.all(
        sampleImages.map(img => cacheImage(img))
      )
      
      const successCount = sampleResults.filter(r => r).length
      
      return new Response(
        JSON.stringify({ 
          message: `Cached sample of ${successCount} images. Total to process daily: ${images?.length || 0}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  } catch (error) {
    console.error("Error in cache-dropbox-images function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

// Helper function for Dropbox URL conversion
function getDropboxDownloadUrl(url: string): string {
  if (url.includes('www.dropbox.com')) {
    try {
      const urlObj = new URL(url)
      const newPath = urlObj.pathname.replace('/scl/fi/', '/').split('?')[0]
      return `https://dl.dropboxusercontent.com${newPath}`
    } catch (error) {
      console.error("Error converting Dropbox URL:", error)
    }
  }
  
  return url.includes('dl=0') 
    ? url.replace('dl=0', 'raw=1') 
    : url.includes('dl=1') 
      ? url.replace('dl=1', 'raw=1')
      : url.includes('raw=1')
        ? url
        : `${url}${url.includes('?') ? '&' : '?'}raw=1`
}
