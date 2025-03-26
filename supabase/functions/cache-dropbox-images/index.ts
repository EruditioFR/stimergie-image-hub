
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

// Global progress tracking
let cachingInProgress = false
let totalImages = 0
let processedImages = 0
let successfulImages = 0
let failedImages = 0
let startTime = 0

// Handle CORS preflight requests
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const reqData = await req.json()
    const { immediate = false, checkProgress = false } = reqData

    // If checking progress, return current progress
    if (checkProgress) {
      if (!cachingInProgress) {
        return new Response(
          JSON.stringify({ 
            inProgress: false,
            message: "No caching operation in progress" 
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        )
      }

      const elapsedTimeMs = Date.now() - startTime
      const progressPercent = totalImages > 0 ? Math.round((processedImages / totalImages) * 100) : 0
      let estimatedTimeRemaining = "Calculating..."
      
      if (processedImages > 0) {
        const msPerImage = elapsedTimeMs / processedImages
        const remainingImages = totalImages - processedImages
        const estimatedRemainingMs = msPerImage * remainingImages
        
        // Format estimated time
        if (estimatedRemainingMs < 60000) {
          estimatedTimeRemaining = `${Math.round(estimatedRemainingMs / 1000)} seconds`
        } else if (estimatedRemainingMs < 3600000) {
          estimatedTimeRemaining = `${Math.round(estimatedRemainingMs / 60000)} minutes`
        } else {
          estimatedTimeRemaining = `${Math.round(estimatedRemainingMs / 3600000)} hours`
        }
      }
      
      return new Response(
        JSON.stringify({ 
          inProgress: true,
          total: totalImages,
          processed: processedImages,
          succeeded: successfulImages,
          failed: failedImages,
          percent: progressPercent,
          estimatedTimeRemaining: estimatedTimeRemaining
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    // If operation already in progress, return status
    if (cachingInProgress) {
      return new Response(
        JSON.stringify({ 
          inProgress: true,
          message: "Caching operation already in progress",
          total: totalImages,
          processed: processedImages,
          percent: totalImages > 0 ? Math.round((processedImages / totalImages) * 100) : 0
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
    
    // Get all images from the database
    const { data: images, error } = await supabase
      .from('images')
      .select('id, title, id_projet, projets!id_projet (nom_dossier)')
      .not('title', 'is', null)
    
    if (error) {
      throw error
    }

    totalImages = images?.length || 0
    console.log(`Found ${totalImages} images to cache`)

    // Function to cache a single image from Stimergie server
    async function cacheImage(imageData: any) {
      try {
        const folderName = imageData.projets?.nom_dossier || '';
        const imageTitle = imageData.title || `image-${imageData.id}`;
        
        if (!folderName || !imageTitle) {
          console.warn(`Missing folder or title for image ${imageData.id}`);
          return false;
        }
        
        // Encode URL components to handle special characters
        const encodedFolder = encodeURIComponent(folderName);
        const encodedTitle = encodeURIComponent(imageTitle);
        
        // Generate the display URL (PNG format)
        const displayUrl = `https://www.stimergie.fr/photos/${encodedFolder}/PNG/${encodedTitle}.png`;
        
        // Fetch the image and get the blob
        const imageBlob = await fetchImageAsBlob(displayUrl)
        
        if (!imageBlob) {
          console.error(`Failed to download image: ${imageTitle}`)
          return false
        }
        
        console.log(`Successfully cached image: ${imageTitle}`)
        return true
      } catch (e) {
        console.error(`Error caching image ${imageData.id}:`, e)
        return false
      }
    }

    // Process immediately if requested (background task)
    if (immediate) {
      // Reset progress tracking
      cachingInProgress = true
      processedImages = 0
      successfulImages = 0
      failedImages = 0
      startTime = Date.now()
      
      // Start background processing
      const processTask = async () => {
        try {
          console.log("Starting background caching process...")
          
          // Process images in batches of 10 pour maximiser le parallélisme
          const batchSize = 10
          for (let i = 0; i < totalImages; i += batchSize) {
            const batch = images?.slice(i, i + batchSize) || []
            
            // Process batch in parallel
            const results = await Promise.all(
              batch.map(img => cacheImage(img))
            )
            
            // Update progress counts
            const batchSuccesses = results.filter(r => r).length
            const batchFailures = results.filter(r => !r).length
            
            successfulImages += batchSuccesses
            failedImages += batchFailures
            processedImages += batch.length
            
            console.log(`Progress: ${processedImages}/${totalImages} (${Math.round((processedImages/totalImages)*100)}%)`)
          }
          
          console.log(`Caching complete: ${successfulImages} successful, ${failedImages} failed`)
        } finally {
          // Make sure we reset the flag even if there's an error
          cachingInProgress = false
        }
      }
      
      // Use EdgeRuntime.waitUntil for background processing
      EdgeRuntime.waitUntil(processTask())
      
      return new Response(
        JSON.stringify({ 
          inProgress: true,
          message: `Started caching ${totalImages} images in the background`,
          total: totalImages
        }),
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
          message: `Cached sample of ${successCount} images. Total to process daily: ${totalImages}` 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }
  } catch (error) {
    console.error("Error in cache-images function:", error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})
