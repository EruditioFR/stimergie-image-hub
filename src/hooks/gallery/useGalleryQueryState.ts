
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
  const [accumulatedImages, setAccumulatedImages] = useState<any[]>([]);

  // Fetch images query with all filters
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

  // Reset accumulated images when filters change
  useEffect(() => {
    if (currentPage === 1) {
      setAccumulatedImages([]);
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
    }
  }, [currentPageImages, currentPage]);

  const refreshGallery = useCallback(() => {
    setAccumulatedImages([]);
    refetch();
  }, [refetch]);

  return {
    allImages: accumulatedImages,
    isLoading,
    isFetching,
    refreshGallery
  };
};
