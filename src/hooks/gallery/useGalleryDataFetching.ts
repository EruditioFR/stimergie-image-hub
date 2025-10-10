
import { useEffect } from 'react';

interface GalleryDataFetchingProps {
  fetchTotalCount: (searchQuery: string, tagFilter: string, activeTab: string, client: string | null, project: string | null, orientation: string | null, userRole: string, userClientId: string | null, userId: string | null) => void;
  prefetchNextPage: (searchQuery: string, tagFilter: string, activeTab: string, client: string | null, project: string | null, orientation: string | null, page: number, userRole: string, userClientId: string | null) => void;
  isLoading: boolean;
  isFetching: boolean;
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  selectedOrientation: string | null;
  currentPage: number;
  totalCount: number;
  userRole: string;
  userClientId: string | null;
  userId: string | null;
  shouldFetchRandom: boolean;
  setTotalCount: (count: number) => void;
}

export const useGalleryDataFetching = ({
  fetchTotalCount,
  prefetchNextPage,
  isLoading,
  isFetching,
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  selectedOrientation,
  currentPage,
  totalCount,
  userRole,
  userClientId,
  userId,
  shouldFetchRandom,
  setTotalCount
}: GalleryDataFetchingProps) => {

  // Prefetch total count for pagination
  useEffect(() => {
    const handleFetchTotalCount = () => {
      fetchTotalCount(
        searchQuery,
        tagFilter,
        activeTab,
        selectedClient,
        selectedProject,
        selectedOrientation,
        userRole,
        userClientId,
        userId
      );
    };

    handleFetchTotalCount();
  }, [
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    fetchTotalCount,
    userRole,
    userClientId,
    userId
  ]);

  // Prefetch next page data
  useEffect(() => {
    const shouldPrefetch = 
      !isLoading && 
      !isFetching && 
      currentPage < Math.ceil(totalCount / 100); // Fixed: use IMAGES_PER_PAGE (100) instead of 20
      
    if (shouldPrefetch) {
      prefetchNextPage(
        searchQuery,
        tagFilter,
        activeTab,
        selectedClient,
        selectedProject,
        selectedOrientation,
        currentPage + 1,
        userRole,
        userClientId
      );
    }
  }, [
    isLoading,
    isFetching,
    currentPage,
    totalCount,
    prefetchNextPage,
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    userRole,
    userClientId
  ]);

  return {};
};
