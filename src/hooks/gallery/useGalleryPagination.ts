
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
  isRandomMode?: boolean;
}

export const useGalleryPagination = ({
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  selectedOrientation,
  userRole,
  userClientId,
  isRandomMode = false
}: GalleryPaginationProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  // Admins: random mode disabled by default, controlled by toggle
  // Non-admins: always use random mode when no filters
  const [shouldFetchRandom, setShouldFetchRandom] = useState(
    userRole === 'admin' ? isRandomMode : true
  );
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

  // Update whether we should fetch random images or not
  const updateRandomFetchMode = useCallback((randomMode: boolean) => {
    setShouldFetchRandom(randomMode);
    setCurrentPage(1); // Reset to page 1 when toggling modes
  }, []);

  // Reset pagination when filters change
  useEffect(() => {
    console.log('Filters changed, resetting pagination');
    const shouldUseRandom = userRole === 'admin' 
      ? isRandomMode // For admins, use the toggle state
      : (!selectedProject && 
         !searchQuery && 
         (!tagFilter || tagFilter === '') && 
         activeTab === 'all' &&
         !selectedOrientation);
    
    resetPagination(shouldUseRandom);
  }, [
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    userRole,
    isRandomMode,
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
    updateRandomFetchMode
  };
};
