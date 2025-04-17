
import { useState, useCallback, useEffect } from 'react';

interface GalleryPaginationProps {
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  selectedOrientation: string | null;
  userRole: string;
  userClientId: string | null;
}

export const useGalleryPagination = ({
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  selectedOrientation,
  userRole,
  userClientId
}: GalleryPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [shouldFetchRandom, setShouldFetchRandom] = useState(true);
  const [allFetched, setAllFetched] = useState(false);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    console.log('Changing to page:', page);
    if (!allFetched) {
      setCurrentPage(page);
    }
  }, [allFetched]);

  // Reset pagination when filters change
  const resetPagination = useCallback((useRandomMode: boolean = false) => {
    console.log('Resetting pagination, random mode:', useRandomMode);
    setCurrentPage(1);
    setShouldFetchRandom(useRandomMode);
    setAllFetched(false);
  }, []);

  // Update whether all images have been fetched
  const checkIfAllFetched = useCallback((fetchedCount: number) => {
    if (fetchedCount < 20) {
      setAllFetched(true);
    }
  }, []);

  // Update whether we should fetch random images or not
  const updateRandomFetchMode = useCallback((randomMode: boolean) => {
    setShouldFetchRandom(randomMode);
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    console.log('Filters changed, resetting pagination');
    resetPagination(
      !selectedProject && 
      !searchQuery && 
      (!tagFilter || tagFilter === '') && 
      activeTab === 'all' &&
      !selectedOrientation
    );
  }, [
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    resetPagination
  ]);

  return {
    currentPage,
    totalCount,
    shouldFetchRandom,
    allFetched,
    setTotalCount,
    handlePageChange,
    resetPagination,
    updateRandomFetchMode,
    checkIfAllFetched
  };
};
