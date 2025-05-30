
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { downloadImage } from '@/utils/image/download';
import { useNavigate } from 'react-router-dom';
import { transformToHDUrl } from '@/utils/image/download/networkUtils';

interface DownloadRequestButtonProps {
  imageId: string;
  imageTitle: string;
  imageSrc: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  isHD?: boolean;
  folderName?: string;  // Add folder name prop
}

export const DownloadRequestButton = ({
  imageId,
  imageTitle,
  imageSrc,
  variant = "outline",
  size = "sm",
  className = "",
  isHD = true,
  folderName = ""  // Default to empty string
}: DownloadRequestButtonProps) => {
  const [isRequesting, setIsRequesting] = React.useState(false);
  const navigate = useNavigate();
  
  const handleClick = async () => {
    try {
      setIsRequesting(true);
      
      console.log('Downloading image:', { imageId, imageTitle, imageSrc, isHD, folderName });
      
      // Create filename with clean title
      const filename = imageTitle
        ? imageTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.jpg'
        : `image_${imageId}.jpg`;
      
      // Generate download URL with the correct format
      let downloadUrl = imageSrc;
      if (folderName) {
        const cleanTitle = imageTitle.replace(/\.(jpg|jpeg|png)$/i, '');
        // Toujours générer avec le format JPG pour assurer la cohérence
        downloadUrl = `https://www.stimergie.fr/photos/${encodeURIComponent(folderName)}/JPG/${encodeURIComponent(cleanTitle)}.jpg`;
        console.log(`Generated URL for download: ${downloadUrl}`);
      }
      
      // Si c'est un téléchargement HD, transformer l'URL
      if (isHD) {
        downloadUrl = transformToHDUrl(downloadUrl);
        console.log(`Transformed to HD URL: ${downloadUrl}`);
      }
      
      // Perform direct download with HD flag
      await downloadImage(downloadUrl, filename, 'jpg', isHD);
      
      toast.success('Image téléchargée avec succès');
      
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast.error('Échec du téléchargement', { 
        description: 'Une erreur est survenue. Veuillez réessayer plus tard.'
      });
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleClick}
      disabled={isRequesting}
    >
      <Download className="h-4 w-4 mr-2" />
      {isRequesting ? 'Envoi...' : (isHD ? 'Télécharger HD' : 'Télécharger')}
    </Button>
  );
};
