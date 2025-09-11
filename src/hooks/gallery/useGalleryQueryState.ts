
import { useQuery } from '@tanstack/react-query';
import { fetchGalleryImages } from '@/services/gallery/imageService';
import { useCallback, useState, useEffect } from 'react';

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
  const [accumulatedImages, setAccumulatedImages] = useState<any[]>([]);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Don't make queries for non-admin users until userClientId is loaded
  const shouldSkipQuery = ['admin_client', 'user'].includes(userRole) && !userClientId && userId;

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

  // Reset accumulated images when filters change
  useEffect(() => {
    if (currentPage === 1) {
      setAccumulatedImages([]);
      setHasMorePages(true);
    }
  }, [searchQuery, tagFilter, activeTab, selectedClient, selectedProject, selectedOrientation, currentPage === 1]);

  // Accumulate images for infinite scrolling
  useEffect(() => {
    if (currentPageImages.length > 0) {
      if (currentPage === 1) {
        setAccumulatedImages(currentPageImages);
      } else {
        // Add new images but prevent duplicates
        const newImageIds = new Set(currentPageImages.map((img: any) => img.id));
        const existingImages = accumulatedImages.filter((img: any) => !newImageIds.has(img.id));
        setAccumulatedImages([...existingImages, ...currentPageImages]);
      }
      
      // Determine if more pages are available
      setHasMorePages(currentPageImages.length >= 20);
    } else if (currentPage > 1 && currentPageImages.length === 0) {
      // If we fetched a page and got no results, we've reached the end
      setHasMorePages(false);
    }
  }, [currentPageImages, currentPage, accumulatedImages]);

  const refreshGallery = useCallback(() => {
    setAccumulatedImages([]);
    setHasMorePages(true);
    refetch();
  }, [refetch]);

  return {
    allImages: accumulatedImages,
    isLoading,
    isFetching,
    refreshGallery,
    hasMorePages
  };
};
