
import { useState, useEffect } from 'react';
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
  tags: string[] | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  id_projet: string;
}

const Images = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching images:', error);
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les images. ' + error.message,
      });
      throw error;
    }

    return data as Image[];
  };

  const { data: images, isLoading, refetch } = useQuery({
    queryKey: ['images'],
    queryFn: fetchImages,
  });

  const handleUploadSuccess = () => {
    setIsUploadOpen(false);
    refetch();
    toast({
      title: 'Succès',
      description: 'Image ajoutée avec succès',
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
      tags: image.tags,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <UserGreetingBar />
      <Header />
      
      <main className="flex-grow pt-20">
        <ImagesHeader 
          onAddClick={() => setIsUploadOpen(true)}
          viewToggle={
            <ViewToggle 
              currentView={viewMode} 
              onViewChange={setViewMode} 
            />
          }
        />
        
        <div className="max-w-7xl mx-auto px-6 py-12">
          {isLoading ? (
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
                <ImagesTable images={images || []} />
              )}
            </>
          )}
        </div>
      </main>
      
      <ImageUploadForm 
        isOpen={isUploadOpen} 
        onClose={() => setIsUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
      
      <Footer />
    </div>
  );
};

export default Images;
