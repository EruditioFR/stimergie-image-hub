 
import { useQuery } from '@tanstack/react-query';
import { fetchGalleryImages } from '@/services/gallery/imageService';
import { useCallback, useMemo } from 'react';
import { useGalleryImageFormatting } from './useGalleryImageFormatting';

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
  userId?: string | null;
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
  userClientId,
  userId
}: GalleryQueryStateProps) => {
  const { formatImagesForGrid } = useGalleryImageFormatting();

  // Skip query only if we definitely don't have access (logged in user without client ID)
  const shouldSkipQuery = userId && ['admin_client', 'user'].includes(userRole) && userClientId === null;

  // Fetch images query with all filters and access control
  const {
    data: currentPageImages = [],
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
      userClientId,
      userId
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
      selectedOrientation,
      userId
    ),
    staleTime: 15000, // 15 seconds (was 60)
    enabled: !shouldSkipQuery, // Skip queries for non-admin users without client ID
  });

  // Format images for the grid
  const formattedImages = useMemo(() => formatImagesForGrid(currentPageImages), [currentPageImages, formatImagesForGrid]);

  // Determine if more pages are available based on page size
  const hasMorePages = formattedImages.length >= 100;

  const refreshGallery = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    allImages: formattedImages,
    isLoading,
    isFetching,
    refreshGallery,
    hasMorePages
  };
};
