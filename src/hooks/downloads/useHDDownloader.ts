
import { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { Image } from '@/utils/image/types';
import { requestServerDownload } from '@/utils/image/download/requestDownload';
import { downloadImage } from '@/utils/image/download';
import { generateDownloadImageHDUrl } from '@/utils/image/imageUrlGenerator';
import { transformToHDUrl } from '@/utils/image/download/networkUtils';

// HD download threshold - use server for 3+ images
const HD_SERVER_THRESHOLD = 3;

export function useHDDownloader() {
  const [isDownloading, setIsDownloading] = useState(false);

  const downloadHD = async (
    user: User | null, 
    allImages: Image[], 
    selectedIds: string[],
    showModal = false
  ): Promise<boolean> => {
    if (selectedIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une image');
      return false;
    }

    if (!user) {
      toast.error('Vous devez être connecté pour télécharger des images HD');
      return false;
    }

    if (isDownloading) {
      toast.info('Un téléchargement HD est déjà en cours');
      return false;
    }

    setIsDownloading(true);

    try {
      // Filtrer les images sélectionnées
      const selectedImages = allImages.filter(img => selectedIds.includes(img.id));
      console.log(`Processing ${selectedImages.length} images for HD download`);

      // Si une seule image est sélectionnée, téléchargement direct
      if (selectedImages.length === 1) {
        const image = selectedImages[0];
        const title = image.title || `image_${image.id}`;
        
        // Déterminer l'URL HD
        let hdUrl = image.download_url || '';
        
        // Si on a un dossier projet, générer l'URL HD explicite
        if (image.projets?.nom_dossier) {
          hdUrl = generateDownloadImageHDUrl(image.projets.nom_dossier, title);
        } 
        // Sinon, essayer de transformer l'URL existante
        else if (image.url && image.url.includes('/JPG/')) {
          hdUrl = transformToHDUrl(image.url);
        }
        
        if (!hdUrl) {
          throw new Error('URL HD indisponible pour cette image');
        }

        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.jpg`;
        
        toast.loading('Préparation du téléchargement HD', {
          id: 'hd-download',
          duration: Infinity
        });
        
        await downloadImage(hdUrl, filename, 'jpg', true);
        
        toast.dismiss('hd-download');
        toast.success('Image HD téléchargée');
        
        return true;
      } 
      // Pour 2 images, téléchargement direct en ZIP côté client
      else if (selectedImages.length < HD_SERVER_THRESHOLD) {
        console.log(`HD download: Using client-side ZIP for ${selectedImages.length} images (below threshold: ${HD_SERVER_THRESHOLD})`);
        
        const imagesForZip = selectedImages.map(img => {
          const title = img.title || `image_${img.id}`;
          let url = img.url || img.display_url || '';
          
          // Générer URL HD explicite si possible
          if (img.projets?.nom_dossier) {
            url = generateDownloadImageHDUrl(img.projets.nom_dossier, title);
          } 
          // Sinon, transformer l'URL si possible
          else if (url && url.includes('/JPG/')) {
            url = transformToHDUrl(url);
          }
          
          return {
            id: img.id,
            url,
            title
          };
        })
        .filter(img => img.url); // Filtrer les URLs vides
        
        if (imagesForZip.length === 0) {
          throw new Error('Aucune image valide pour téléchargement HD');
        }
        
        // Import dynamique pour éviter des dépendances circulaires
        const { downloadImagesAsZip } = await import('@/utils/image/download');
        
        toast.loading('Préparation des images HD', {
          id: 'hd-zip-prep',
          duration: Infinity
        });
        
        const zipName = `images_hd_${Date.now()}.zip`;
        await downloadImagesAsZip(imagesForZip, zipName, true);
        
        toast.dismiss('hd-zip-prep');
        toast.success('Images HD téléchargées');
        
        return true;
      }
      // Pour 3+ images, utiliser le serveur
      else {
        console.log(`HD download: Using server-side download for ${selectedImages.length} images (threshold: ${HD_SERVER_THRESHOLD})`);
        
        const imagesForZip = selectedImages.map(img => {
          const title = img.title || `image_${img.id}`;
          let url = img.url || img.display_url || '';
          
          // Générer URL HD explicite si possible
          if (img.projets?.nom_dossier) {
            url = generateDownloadImageHDUrl(img.projets.nom_dossier, title);
          } 
          // Sinon, transformer l'URL si possible
          else if (url && url.includes('/JPG/')) {
            url = transformToHDUrl(url);
          }
          
          return {
            id: img.id,
            url,
            title
          };
        })
        .filter(img => img.url); // Filtrer les URLs vides
        
        if (imagesForZip.length === 0) {
          throw new Error('Aucune image valide pour téléchargement HD');
        }

        // Utiliser la logique de téléchargement côté serveur
        if (!showModal) {
          toast.loading('Préparation des images HD pour téléchargement', {
            id: 'hd-zip-prep',
            duration: Infinity
          });
        }
        
        const result = await requestServerDownload(user, imagesForZip, true);
        
        if (!showModal) {
          toast.dismiss('hd-zip-prep');
          
          if (result) {
            toast.success('Images HD prêtes au téléchargement', {
              description: 'Consultez la page "Téléchargements" pour accéder à votre archive.'
            });
          }
        }
        
        return result;
      }

    } catch (error) {
      console.error('HD download error:', error);
      toast.error('Échec du téléchargement HD', {
        description: error instanceof Error ? error.message : 'Une erreur est survenue'
      });
      return false;
    } finally {
      setIsDownloading(false);
    }
  };

  return {
    isDownloading,
    downloadHD
  };
}
