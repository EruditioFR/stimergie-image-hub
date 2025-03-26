// Simple fetchImageAsBlob function without caching
export async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    console.log(`Downloading: ${url}`);
    
    // Configure fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*, */*;q=0.8',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Download failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error(`HTML response detected via headers: ${contentType}`);
      return null;
    }
    
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error("Empty download blob");
      return null;
    }
    
    // Check if the response is potentially HTML (error page) and not an image
    if (isHtmlContent(blob)) {
      console.error("Response seems to be an HTML page and not an image");
      return null;
    }
    
    console.log(`Image downloaded successfully, type: ${blob.type}, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error("Error during download:", error);
    return null;
  }
}

/**
 * Check if a blob is probably HTML content and not an image
 */
function isHtmlContent(blob: Blob): boolean {
  // Check MIME type
  if (blob.type.includes('text/html') || blob.type.includes('application/xhtml+xml')) {
    return true;
  }
  
  // Small files are probably error pages
  if (blob.size < 1000) {
    return true;
  }
  
  return false;
}

/**
 * Calculate average processing speed and estimated time
 */
export function calculateTimeEstimates(
  processed: number, 
  total: number, 
  startTime: number
): { estimatedTimeRemaining: string, averageSpeed: string } {
  // Éviter la division par zéro
  if (processed === 0) {
    return { 
      estimatedTimeRemaining: "Calcul en cours...",
      averageSpeed: "0 img/min"
    }
  }
  
  const elapsedSeconds = (Date.now() - startTime) / 1000
  const imagesPerSecond = processed / elapsedSeconds
  const imagesPerMinute = imagesPerSecond * 60
  
  // Calculer le temps restant en secondes
  const remainingImages = total - processed
  const remainingSeconds = remainingImages / imagesPerSecond
  
  // Formater le temps restant
  let timeString = "Calcul en cours..."
  if (remainingSeconds > 0 && isFinite(remainingSeconds)) {
    if (remainingSeconds < 60) {
      timeString = `${Math.ceil(remainingSeconds)} secondes`
    } else if (remainingSeconds < 3600) {
      timeString = `${Math.ceil(remainingSeconds / 60)} minutes`
    } else {
      const hours = Math.floor(remainingSeconds / 3600)
      const minutes = Math.ceil((remainingSeconds % 3600) / 60)
      timeString = `${hours}h ${minutes}min`
    }
  }
  
  // Formater la vitesse
  const speedString = `${Math.round(imagesPerMinute * 10) / 10} img/min`
  
  return {
    estimatedTimeRemaining: timeString,
    averageSpeed: speedString
  }
}

