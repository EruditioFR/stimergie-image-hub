
import { useState, useCallback } from 'react';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { ImageUploadForm } from '@/components/images/ImageUploadForm';
import { ImagesTable } from '@/components/images/ImagesTable';
import { ImagesHeader } from '@/components/images/ImagesHeader';
import { useAuth } from '@/context/AuthContext';
import { ViewMode, ViewToggle } from '@/components/ui/ViewToggle';
import { MasonryGrid } from '@/components/gallery/masonry/MasonryGrid';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Image as ImageType } from '@/utils/image/types';
import { generateDisplayImageUrl, generateDownloadImageSDUrl, generateDownloadImageHDUrl } from '@/utils/image/imageUrlGenerator';
import { parseTagsString } from '@/utils/imageUtils';
import { OrientationFilter } from '@/components/gallery/OrientationFilter';

export interface Image {
  id: number;
  title: string;
  description: string | null;
  url: string;
  width: number;
  height: number;
  orientation: string;
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  id_projet: string;
  url_miniature?: string | null;
  display_url?: string;
  download_url?: string;
  download_url_sd?: string;
}

const IMAGES_PER_PAGE = 20;

const Images = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const fetchImages = async ({ pageParam = 1 }) => {
    console.log(`Fetching images for page ${pageParam}`);
    let query = supabase
      .from('images')
      .select('*, projets!id_projet (nom_dossier, nom_projet)')
      
    if (selectedOrientation) {
      query = query.eq('orientation', selectedOrientation);
    }
    
    // Add pagination to the query
    const from = (pageParam - 1) * IMAGES_PER_PAGE;
    const to = from + IMAGES_PER_PAGE - 1;
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)
      .limit(IMAGES_PER_PAGE);
      
    if (error) {
      console.error('Error fetching images:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les images. ' + error.message
      });
      throw error;
    }
    
    console.log(`Fetched ${data.length} images`);
    
    // Check if there are more pages
    if (data.length < IMAGES_PER_PAGE) {
      setHasMorePages(false);
    }
    
    const formattedData = data.map(img => {
      const folderName = img.projets?.nom_dossier || "";
      const imageTitle = img.title || `image-${img.id}`;
      
      console.log(`Processing image ${img.id}: title=${imageTitle}, folder=${folderName}`);
      
      const display_url = generateDisplayImageUrl(folderName, imageTitle);
      const download_sd_url = generateDownloadImageSDUrl(folderName, imageTitle);
      const download_hd_url = generateDownloadImageHDUrl(folderName, imageTitle);
      
      let parsedTags = null;
      if (img.tags) {
        parsedTags = typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags;
      }
      
      return {
        ...img,
        display_url,
        download_url: download_hd_url,
        download_url_sd: download_sd_url,
        tags: parsedTags
      };
    }) as Image[];
    
    return formattedData;
  };
  
  const {
    data: images = [],
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['images', selectedOrientation, currentPage],
    queryFn: () => fetchImages({ pageParam: currentPage }),
  });
  
  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    refetch();
    toast({
      title: 'Succès',
      description: 'Image ajoutée avec succès'
    });
  };

  const formatImagesForGrid = (images: Image[] = []) => {
    return images.map(image => {
      console.log(`Image ${image.id} tags:`, image.tags);
      
      if (!image.display_url) {
        console.warn(`Missing display_url for image ${image.id}: ${image.title}`);
      }
      if (!image.download_url) {
        console.warn(`Missing download_url for image ${image.id}: ${image.title}`);
      }
      if (!image.download_url_sd) {
        console.warn(`Missing download_url_sd for image ${image.id}: ${image.title}`);
      }

      let processedTags = [];
      if (image.tags) {
        if (typeof image.tags === 'string') {
          processedTags = parseTagsString(image.tags);
        } else if (Array.isArray(image.tags)) {
          processedTags = image.tags;
        }
      }
      
      console.log(`Processed tags for image ${image.id}:`, processedTags);

      return {
        id: image.id.toString(),
        src: image.display_url || image.url_miniature || image.url,
        display_url: image.display_url || '',
        download_url: image.download_url || '',
        download_url_sd: image.download_url_sd || '',
        alt: image.title,
        title: image.title,
        author: 'User',
        tags: processedTags,
        width: image.width,
        height: image.height,
        orientation: image.orientation,
        created_at: image.created_at
      } as ImageType;
    });
  };

  const handleOrientationChange = (orientation: string | null) => {
    setSelectedOrientation(orientation);
    setCurrentPage(1); // Reset to first page when filter changes
    setHasMorePages(true);
  };
  
  const loadMoreImages = useCallback(() => {
    if (!isLoading && hasMorePages) {
      console.log('Loading more images');
      setCurrentPage(prev => prev + 1);
    }
  }, [isLoading, hasMorePages]);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow py-0">
        <ImagesHeader onAddClick={() => setIsUploadOpen(true)} viewToggle={<ViewToggle currentView={viewMode} onViewChange={setViewMode} />} />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-6">
            <div className="w-64">
              <OrientationFilter 
                selectedOrientation={selectedOrientation}
                onOrientationChange={handleOrientationChange}
              />
            </div>
          </div>
          
          {isLoading && images.length === 0 ? (
            <div className="text-center py-20">
              <p>Chargement des images...</p>
            </div>
          ) : (
            <>
              {viewMode === 'card' ? (
                <MasonryGrid 
                  images={formatImagesForGrid(images)} 
                  isLoading={isLoading}
                  hasMorePages={hasMorePages}
                  loadMoreImages={loadMoreImages}
                />
              ) : (
                <ImagesTable images={formatImagesForGrid(images) || []} />
              )}
            </>
          )}
        </div>
      </main>
      
      <ImageUploadForm 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)} 
        onSuccess={handleUploadSuccess} 
        userRole={userRole} 
      />
      
      <Footer />
    </div>
  );
};

export default Images;
