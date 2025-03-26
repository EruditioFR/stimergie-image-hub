
/**
 * Simplified image fetch utilities without caching
 */

export const isHtmlContent = (blob: Blob): boolean => {
  // Check MIME type
  if (blob.type.includes('text/html') || blob.type.includes('application/xhtml+xml')) {
    return true;
  }
  
  // Small files are probably error pages
  if (blob.size < 1000) {
    return true;
  }
  
  return false;
};

// Basic fetch function without caching
export async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  try {
    console.log(`Downloading: ${url}`);
    
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',
      headers: {
        'Accept': 'image/*, */*;q=0.8',
      }
    });
    
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
