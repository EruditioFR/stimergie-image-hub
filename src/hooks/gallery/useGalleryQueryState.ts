
import { useQuery } from '@tanstack/react-query';
import { fetchGalleryImages } from '@/services/gallery/imageService';
import { useCallback } from 'react';

interface GalleryQueryStateProps {
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  selectedOrientation: string | null;
  currentPage: number;
  shouldFetchRandom: boolean;
  userRole: string;
  userClientId: string | null;
}

export const useGalleryQueryState = ({
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  selectedOrientation,
  currentPage,
  shouldFetchRandom,
  userRole,
  userClientId
}: GalleryQueryStateProps) => {
  // Fetch images query with all filters
  const {
    data: allImages = [],
    isLoading,
    isFetching,
    refetch
  } = useQuery({
    queryKey: [
      'gallery-images',
      searchQuery,
      tagFilter,
      activeTab,
      selectedClient,
      selectedProject,
      selectedOrientation,
      currentPage,
      shouldFetchRandom,
      userRole,
      userClientId
    ],
    queryFn: () => fetchGalleryImages(
      searchQuery,
      tagFilter,
      activeTab,
      selectedClient,
      selectedProject,
      currentPage,
      shouldFetchRandom,
      userRole,
      userClientId,
      selectedOrientation
    ),
    staleTime: 60000, // 1 minute
  });

  const refreshGallery = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    allImages,
    isLoading,
    isFetching,
    refreshGallery
  };
};
