
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from 'sonner';

interface Image {
  id: string;
  src: string;
  alt?: string;
  title?: string;
}

export async function downloadImages(images: Image[]) {
  if (images.length === 0) {
    toast.error("Veuillez sélectionner au moins une image");
    return;
  }

  try {
    toast.info("Préparation du téléchargement...");
    
    const zip = new JSZip();
    
    const fetchPromises = images.map(async (img, index) => {
      try {
        const imageUrl = img.src;
        console.log(`Fetching image: ${imageUrl}`);
        
        const response = await fetch(imageUrl, { 
          mode: 'cors',
          cache: 'no-cache'
        });
        
        if (!response.ok) {
          console.error(`Failed to fetch ${imageUrl}: ${response.status} ${response.statusText}`);
          throw new Error(`Failed to fetch ${imageUrl}`);
        }
        
        const blob = await response.blob();
        console.log(`Image fetched successfully: ${imageUrl}, size: ${blob.size} bytes`);
        
        let extension = 'jpg';
        if (blob.type) {
          extension = blob.type.split('/')[1] || 'jpg';
        } else if (imageUrl.includes('.')) {
          extension = imageUrl.split('.').pop() || 'jpg';
        }
        
        const filename = `image_${index + 1}.${extension}`;
        console.log(`Adding to zip as: ${filename}`);
        
        zip.file(filename, blob);
        return true;
      } catch (error) {
        console.error(`Error processing image ${img.src}:`, error);
        return false;
      }
    });
    
    try {
      await Promise.all(fetchPromises);
      console.log("All fetch promises completed");
      
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
      });
      
      console.log(`ZIP generated, size: ${zipBlob.size} bytes`);
      
      saveAs(zipBlob, `images_selection_${new Date().toISOString().slice(0, 10)}.zip`);
      toast.success("Téléchargement prêt");
      return true;
    } catch (error) {
      console.error("Error processing images:", error);
      toast.error("Certaines images n'ont pas pu être téléchargées");
      return false;
    }
  } catch (error) {
    console.error("Error creating zip:", error);
    toast.error("Une erreur est survenue lors du téléchargement");
    return false;
  }
}
