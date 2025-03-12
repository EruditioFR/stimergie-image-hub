
import { useState } from 'react';
import { Header } from '@/components/ui/layout/Header';
import { Footer } from '@/components/ui/layout/Footer';
import { ImageUploadForm } from '@/components/images/ImageUploadForm';
import { ImagesTable } from '@/components/images/ImagesTable';
import { ImagesHeader } from '@/components/images/ImagesHeader';
import { useAuth } from '@/context/AuthContext';
import { UserGreetingBar } from '@/components/ui/UserGreetingBar';
import { ViewMode, ViewToggle } from '@/components/ui/ViewToggle';
import { MasonryGrid } from '@/components/gallery/MasonryGrid';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

export interface Image {
  id: number;
  title: string;
  description: string | null;
  url: string;
  width: number;
  height: number;
  orientation: string;
  // Modification ici : tags peut être une string (de la BDD) qu'on va parser en tableau
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  id_projet: string;
  url_miniature?: string | null;
}

const Images = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const {
    user,
    userRole
  } = useAuth();
  const {
    toast
  } = useToast();
  
  const fetchImages = async () => {
    let query = supabase.from('images').select('*').order('created_at', {
      ascending: false
    });

    // If the user is admin_client, only show images from their client's projects
    if (userRole === 'admin_client') {
      // First, get the user's client ID from their profile
      const {
        data: profileData,
        error: profileError
      } = await supabase.from('profiles').select('id_client').eq('id', user?.id).single();
      if (profileError) {
        throw profileError;
      }

      // If they have a client ID, filter images by projects belonging to that client
      if (profileData?.id_client) {
        // Get all projects for this client
        const {
          data: projectsData,
          error: projectsError
        } = await supabase.from('projets').select('id').eq('id_client', profileData.id_client);
        if (projectsError) {
          throw projectsError;
        }

        // Extract project IDs
        const projectIds = projectsData.map(project => project.id);

        // Filter images by these project IDs
        if (projectIds.length > 0) {
          query = query.in('id_projet', projectIds);
        } else {
          // If no projects, return empty array (no images)
          return [];
        }
      }
    }
    
    const {
      data,
      error
    } = await query;
    
    if (error) {
      console.error('Error fetching images:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les images. ' + error.message
      });
      throw error;
    }
    
    // Convertir les tags de string à string[] en parsant la valeur JSON si nécessaire
    return data.map(img => ({
      ...img,
      tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
    })) as Image[];
  };
  
  // Fonction utilitaire pour parser les tags depuis une string
  const parseTagsString = (tagsString: string | null): string[] | null => {
    if (!tagsString) return null;
    try {
      // Si c'est déjà un JSON (format "[tag1, tag2]"), on le parse
      if (tagsString.startsWith('[')) {
        return JSON.parse(tagsString);
      }
      // Sinon, on le split par virgule (si c'est un format "tag1,tag2")
      return tagsString.split(',').map(tag => tag.trim());
    } catch (e) {
      console.error('Error parsing tags:', e);
      return [tagsString]; // Fallback à un tableau avec la string originale
    }
  };
  
  const {
    data: images,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['images', userRole],
    queryFn: fetchImages
  });
  
  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    refetch();
    toast({
      title: 'Succès',
      description: 'Image ajoutée avec succès'
    });
  };

  // Adapt images format for MasonryGrid component
  const formatImagesForGrid = (images: Image[] = []) => {
    return images.map(image => ({
      id: image.id.toString(),
      src: image.url,
      alt: image.title,
      title: image.title,
      author: 'User',
      tags: image.tags
    }));
  };
  
  return <div className="min-h-screen flex flex-col">
      <UserGreetingBar />
      <Header />
      
      <main className="flex-grow pt-20 py-0">
        <ImagesHeader onAddClick={() => setIsUploadOpen(true)} viewToggle={<ViewToggle currentView={viewMode} onViewChange={setViewMode} />} />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoading ? <div className="text-center py-20">
              <p>Chargement des images...</p>
            </div> : <>
              {viewMode === 'card' ? <MasonryGrid images={formatImagesForGrid(images)} isLoading={isLoading} /> : <ImagesTable images={images || []} />}
            </>}
        </div>
      </main>
      
      <ImageUploadForm isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} onSuccess={handleUploadSuccess} userRole={userRole} />
      
      <Footer />
    </div>;
};

export default Images;
