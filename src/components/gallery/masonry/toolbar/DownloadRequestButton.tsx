
import React from 'react';
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { prepareDownloadFile } from '@/utils/image/download';
import { useNavigate } from 'react-router-dom';

interface DownloadRequestButtonProps {
  imageId: string;
  imageTitle: string;
  imageSrc: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
  isHD?: boolean;
}

export const DownloadRequestButton = ({
  imageId,
  imageTitle,
  imageSrc,
  variant = "outline",
  size = "sm",
  className = "",
  isHD = true
}: DownloadRequestButtonProps) => {
  const [isRequesting, setIsRequesting] = React.useState(false);
  const navigate = useNavigate();
  
  const handleClick = async () => {
    try {
      setIsRequesting(true);
      
      console.log('Requesting download for image:', { imageId, imageTitle });
      
      const success = await prepareDownloadFile({
        imageId: imageId.toString(),
        imageTitle,
        imageSrc,
        isHD
      });
      
      if (success) {
        toast.success('Demande de téléchargement enregistrée', { 
          description: 'Vous pouvez suivre votre téléchargement dans la page téléchargements.',
          action: {
            label: 'Voir mes téléchargements',
            onClick: () => navigate('/downloads')
          }
        });
      }
      
    } catch (error) {
      console.error('Erreur lors de la demande de téléchargement:', error);
      toast.error('Échec de la demande', { 
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
