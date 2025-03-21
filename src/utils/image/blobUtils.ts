
/**
 * Converts a Blob to base64 string for storage
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts a base64 string back to a Blob
 */
export function base64ToBlob(base64: string): Promise<Blob> {
  return fetch(base64).then(res => res.blob());
}

/**
 * Checks if a blob is likely HTML content and not an image
 */
export function isHtmlContent(blob: Blob): boolean {
  // Check MIME type
  if (blob.type.includes('text/html') || blob.type.includes('application/xhtml+xml')) {
    return true;
  }
  
  // Small files are likely error pages
  if (blob.size < 1000) {
    return true;
  }
  
  return false;
}

/**
 * Determines if an image URL is already in the browser cache
 */
export function isImageInBrowserCache(url: string): Promise<boolean> {
  return new Promise(resolve => {
    // Check if the image is in the browser cache using performance method
    const img = new Image();
    let isCached = false;
    
    // Image loads quickly if it's in cache
    img.onload = () => {
      // Check loading time - less than 20ms suggests loading from cache
      resolve(isCached);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    // Start checking time after setting src
    img.src = url;
    // Use current time to check loading speed
    const startTime = performance.now();
    
    // After a short time, check if the image is fully loaded
    setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) {
        const loadTime = performance.now() - startTime;
        isCached = loadTime < 20; // Considered cached if loaded in less than 20ms
      }
    }, 10);
  });
}
