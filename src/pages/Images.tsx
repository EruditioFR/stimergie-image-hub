
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
import { useUserPermissions } from '@/hooks/users/useUserPermissions';
import { getAccessibleProjectIds } from '@/services/gallery/projectUtils';
import { ClientsFilter } from '@/components/gallery/ClientsFilter';
import { MasonryPagination } from '@/components/gallery/masonry/MasonryPagination';
import { Input } from '@/components/ui/input';

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
  projets?: {
    nom_projet?: string;
    nom_dossier?: string;
    clients?: {
      id?: string;
      nom?: string;
    };
  };
}

const IMAGES_PER_PAGE = 20;

const Images = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const { isAdmin, userClientIds } = useUserPermissions();
  
  const fetchImages = async ({ pageParam = 1 }) => {
    console.log(`Fetching images for page ${pageParam}, user role: ${userRole}`);
    
    // Get accessible projects for the user
    let accessibleProjectIds: string[] = [];
    if (!isAdmin && user) {
      accessibleProjectIds = await getAccessibleProjectIds(user.id);
      console.log(`User has access to ${accessibleProjectIds.length} projects`);
      
      if (accessibleProjectIds.length === 0) {
        console.log('User has no accessible projects');
        setTotalCount(0);
        return [];
      }
    }
    
    // Build base query for count
    let countQuery = supabase
      .from('images')
      .select('*', { count: 'exact', head: true });
    
    // Build base query for data
    let query = supabase
      .from('images')
      .select('*, projets!id_projet (nom_dossier, nom_projet, clients:id_client(id, nom))');
      
    // Filter by accessible projects for non-admin users
    if (!isAdmin && accessibleProjectIds.length > 0) {
      query = query.in('id_projet', accessibleProjectIds);
      countQuery = countQuery.in('id_projet', accessibleProjectIds);
    }
    
    // Apply filters to both queries
    if (selectedOrientation) {
      query = query.eq('orientation', selectedOrientation);
      countQuery = countQuery.eq('orientation', selectedOrientation);
    }
    
    if (selectedClient) {
      // Filter by client through project relationship
      const { data: clientProjects } = await supabase
        .from('projets')
        .select('id')
        .eq('id_client', selectedClient);
      
      if (clientProjects) {
        const projectIds = clientProjects.map(p => p.id);
        if (projectIds.length > 0) {
          query = query.in('id_projet', projectIds);
          countQuery = countQuery.in('id_projet', projectIds);
        } else {
          setTotalCount(0);
          return [];
        }
      }
    }
    
    if (tagFilter) {
      const term = tagFilter.trim();
      if (term) {
        query = query.ilike('tags', `%${term}%`);
        countQuery = countQuery.ilike('tags', `%${term}%`);
      }
    }
    
    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
      countQuery = countQuery.ilike('title', `%${searchQuery}%`);
    }
    
    // Fetch total count
    const { count } = await countQuery;
    setTotalCount(count || 0);
    
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
    queryKey: ['images', selectedOrientation, currentPage, userRole, user?.id, userClientIds, selectedClient, tagFilter, searchQuery],
    queryFn: () => fetchImages({ pageParam: currentPage }),
    enabled: !!user && (isAdmin || userClientIds.length > 0),
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
        created_at: image.created_at,
        projets: image.projets
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
        <ImagesHeader 
          onAddClick={() => setIsUploadOpen(true)} 
          viewToggle={<ViewToggle currentView={viewMode} onViewChange={setViewMode} />}
          userRole={userRole}
        />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          {/* Filtres */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="w-full sm:w-auto">
              <ClientsFilter 
                selectedClient={selectedClient}
                onClientChange={(clientId) => {
                  setSelectedClient(clientId);
                  setCurrentPage(1);
                }}
                userRole={userRole}
                userClientId={userClientIds[0] || null}
                userClientIds={userClientIds}
                isAdmin={isAdmin}
              />
            </div>
            
            <div className="w-full sm:w-auto">
              <OrientationFilter 
                selectedOrientation={selectedOrientation}
                onOrientationChange={(orientation) => {
                  setSelectedOrientation(orientation);
                  setCurrentPage(1);
                  setHasMorePages(true);
                }}
              />
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Rechercher par titre..."
                className="w-full"
              />
            </div>
            
            <div className="w-full sm:w-auto min-w-[200px]">
              <Input
                type="text"
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Filtrer par tag..."
                className="w-full"
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
                />
              ) : (
                <ImagesTable images={formatImagesForGrid(images) || []} />
              )}
            </>
          )}
          
          {/* Pagination */}
          <MasonryPagination
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isLoading={isLoading}
            imagesPerPage={IMAGES_PER_PAGE}
          />
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
