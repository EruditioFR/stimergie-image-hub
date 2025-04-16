
import { useEffect } from 'react';

interface GalleryInitializationProps {
  resetPagination: (useRandomMode?: boolean) => void;
  updateRandomFetchMode: (randomMode: boolean) => void;
  updateFilterStatus: (searchQuery: string, tagFilter: string) => void;
  enforceClientForNonAdmin: () => void;
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  selectedOrientation: string | null;
  userRole: string;
  currentPage: number;
  baseHandleClientChange: (clientId: string | null) => void;
}

export const useGalleryInitialization = ({
  resetPagination,
  updateRandomFetchMode,
  updateFilterStatus,
  enforceClientForNonAdmin,
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  selectedOrientation,
  userRole,
  currentPage,
  baseHandleClientChange
}: GalleryInitializationProps) => {

  // Enforce client filter for non-admin users
  useEffect(() => {
    enforceClientForNonAdmin();
  }, [enforceClientForNonAdmin, userRole]);

  // Initial filters setup and random mode determination
  useEffect(() => {
    // Determine if we should show random images (no specific filters applied)
    const noSpecificFilters = 
      !searchQuery && 
      !tagFilter && 
      activeTab === 'all' && 
      !selectedProject &&
      !selectedOrientation;

    updateRandomFetchMode(noSpecificFilters);
    updateFilterStatus(searchQuery, tagFilter);
  }, [
    searchQuery, 
    tagFilter, 
    activeTab, 
    selectedClient, 
    selectedProject,
    selectedOrientation,
    updateRandomFetchMode,
    updateFilterStatus
  ]);

  // Force clear filters and page when filters are really changed
  useEffect(() => {
    if (currentPage === 1) {
      console.log('On page 1, forcing filter refresh');
      resetPagination(
        !searchQuery && 
        !tagFilter && 
        activeTab === 'all' && 
        !selectedProject &&
        !selectedOrientation
      );
    }
  }, [
    searchQuery, 
    tagFilter, 
    activeTab, 
    selectedClient, 
    selectedProject,
    selectedOrientation,
    resetPagination
  ]);

  return {};
};
