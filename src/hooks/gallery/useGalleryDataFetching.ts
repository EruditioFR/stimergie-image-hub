
import { useEffect } from 'react';

interface GalleryDataFetchingProps {
  fetchTotalCount: (
    searchQuery: string,
    tagFilter: string,
    activeTab: string,
    selectedClient: string | null,
    selectedProject: string | null,
    userRole: string,
    userClientId: string | null,
    totalCount: number,
    setTotalCount: (count: number) => void
  ) => void;
  prefetchNextPage: (
    isLoading: boolean,
    isFetching: boolean,
    shouldFetchRandom: boolean,
    searchQuery: string,
    tagFilter: string,
    activeTab: string,
    selectedClient: string | null,
    selectedProject: string | null,
    currentPage: number,
    totalCount: number,
    userRole: string,
    userClientId: string | null
  ) => void;
  isLoading: boolean;
  isFetching: boolean;
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  currentPage: number;
  totalCount: number;
  userRole: string;
  userClientId: string | null;
  shouldFetchRandom: boolean;
  setTotalCount: (count: number) => void;
}

/**
 * Hook for handling data fetching related side effects
 */
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
  currentPage,
  totalCount,
  userRole,
  userClientId,
  shouldFetchRandom,
  setTotalCount
}: GalleryDataFetchingProps) => {
  // Fetch total count when needed
  useEffect(() => {
    if (isFetching || isLoading) return;
    fetchTotalCount(
      searchQuery,
      tagFilter,
      activeTab,
      selectedClient,
      selectedProject,
      userRole,
      userClientId,
      totalCount,
      setTotalCount
    );
  }, [fetchTotalCount, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, isFetching, isLoading, totalCount, userRole, userClientId, setTotalCount]);

  // Prefetch next page for smoother experience
  useEffect(() => {
    prefetchNextPage(
      isLoading,
      isFetching,
      shouldFetchRandom,
      searchQuery,
      tagFilter,
      activeTab,
      selectedClient,
      selectedProject,
      currentPage,
      totalCount,
      userRole,
      userClientId
    );
  }, [prefetchNextPage, isLoading, isFetching, shouldFetchRandom, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, currentPage, totalCount, userRole, userClientId]);
  
  return {
    // This hook is purely for side effects, no need to return anything
  };
};
