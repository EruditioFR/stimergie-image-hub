
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Header } from "@/components/ui/layout/Header";
import { Footer } from "@/components/ui/layout/Footer";
import { AlbumsList } from '@/components/albums/AlbumsList';
import { AlbumsHeader } from '@/components/albums/AlbumsHeader';
import { useAuth } from '@/context/AuthContext';
import { LoadingAlbums } from '@/components/albums/LoadingAlbums';
import { EmptyAlbums } from '@/components/albums/EmptyAlbums';
import { toast } from 'sonner';
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Define the Album type based on the database structure
export interface Album {
  id: string;
  name: string;
  description: string | null;
  access_from: string;
  access_until: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
  share_key: string;
  image_count: number;
}

export default function SharedAlbums() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const limit = 10; // Number of albums per page
  
  // Fetch shared albums
  const { 
    data: albums = [], 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ['shared-albums', page],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_shared_albums', { 
          limit_param: limit, 
          offset_param: (page - 1) * limit 
        });
      
      if (error) {
        console.error('Error fetching albums:', error);
        throw error;
      }
      
      return data as Album[];
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  
  // Fetch total albums count for pagination
  const { data: totalCount = 0 } = useQuery({
    queryKey: ['shared-albums-count'],
    queryFn: async () => {
      const { data, error } = await supabase
        .rpc('get_user_shared_albums_count');
      
      if (error) {
        console.error('Error fetching albums count:', error);
        throw error;
      }
      
      return data as number;
    },
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  
  const totalPages = Math.ceil(totalCount / limit);
  
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  if (error) {
    toast.error("Erreur lors du chargement des albums");
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <AlbumsHeader onRefresh={refetch} />
        
        {isLoading ? (
          <LoadingAlbums />
        ) : albums.length === 0 ? (
          <EmptyAlbums />
        ) : (
          <>
            <AlbumsList albums={albums} />
            
            {totalPages > 1 && (
              <Pagination className="mt-8">
                <PaginationContent>
                  <PaginationItem>
                    <Button
                      onClick={handlePreviousPage}
                      disabled={page === 1}
                      variant="ghost"
                      size="icon"
                      className="gap-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Précédent</span>
                    </Button>
                  </PaginationItem>
                  <div className="mx-4 flex items-center">
                    Page {page} sur {totalPages}
                  </div>
                  <PaginationItem>
                    <Button
                      onClick={handleNextPage}
                      disabled={page >= totalPages}
                      variant="ghost"
                      size="icon"
                      className="gap-1"
                    >
                      <span>Suivant</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
