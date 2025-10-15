 
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
  userClientIds?: string[];
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
  userClientIds = [],
  userId
}: GalleryQueryStateProps) => {
  const { formatImagesForGrid } = useGalleryImageFormatting();

  // Determine effective client for initial queries
  const effectiveClient = useMemo(() => {
    // Si l'utilisateur a plusieurs clients et n'a pas sélectionné, ne pas filtrer
    if (['admin_client', 'user'].includes(userRole) && userClientIds.length > 1 && !selectedClient) {
      return null; // Voir tous les projets accessibles
    }
    // Si un seul client, le forcer
    if (['admin_client', 'user'].includes(userRole) && userClientIds.length === 1) {
      return userClientIds[0];
    }
    // Fallback sur userClientId si pas de userClientIds
    if (['admin_client', 'user'].includes(userRole) && userClientId && userClientIds.length === 0) {
      return userClientId;
    }
    return selectedClient;
  }, [userRole, userClientId, userClientIds, selectedClient]);

  // Skip query only if we definitely don't have access (logged in user without client ID)
  const shouldSkipQuery = userId && ['admin_client', 'user'].includes(userRole) && userClientId === null;
  
  // Wait for userClientIds to load for non-admin users to avoid empty results
  const shouldWaitForClientIds = ['admin_client', 'user'].includes(userRole) && !!userId && userClientIds.length === 0;

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
      effectiveClient,
      selectedProject,
      selectedOrientation,
      currentPage,
      shouldFetchRandom,
      userRole,
      userClientId,
      userId,
      userClientIds // Include to trigger refetch when client IDs are loaded
    ],
    queryFn: () => fetchGalleryImages(
      searchQuery,
      tagFilter,
      activeTab,
      effectiveClient,
      selectedProject,
      currentPage,
      shouldFetchRandom,
      userRole,
      userClientId,
      selectedOrientation,
      userId,
      userClientIds
    ),
    staleTime: 300000, // 5 minutes for better caching
    enabled: !shouldSkipQuery && !shouldWaitForClientIds, // Wait for client IDs to load for non-admin users
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
