
// Re-export all download functionality from the modular files
export * from './download/index';

/**
 * Downloads an image from a given URL and saves it to the user's device
 * @param url URL of the image to download
 * @param filename Filename to use for the saved file
 */
export async function downloadImage(url: string, filename: string): Promise<void> {
  console.log(`Downloading image from: ${url}`);
  console.log(`Saving as filename: ${filename}`);
  
  try {
    // Fetch the image
    const response = await fetch(url, { 
      mode: 'no-cors',
      headers: {
        'pragma': 'no-cache',
        'cache-control': 'no-cache'
      } 
    });
    
    if (!response) {
      throw new Error('No response received from the server');
    }
    
    // Create a blob from the response
    const blob = await response.blob();
    
    // Create a download link and click it to trigger the download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    setTimeout(() => {
      URL.revokeObjectURL(link.href);
      document.body.removeChild(link);
    }, 100);
    
    console.log('Download completed successfully');
  } catch (error) {
    console.error('Error downloading image:', error);
    throw error;
  }
}
