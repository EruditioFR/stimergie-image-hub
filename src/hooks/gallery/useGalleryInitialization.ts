
import { useEffect } from 'react';

interface GalleryInitializationProps {
  resetPagination: () => void;
  updateRandomFetchMode: (searchQuery: string, tagFilter: string, activeTab: string, selectedProject: string | null, userRole: string, selectedClient: string | null) => void;
  updateFilterStatus: (searchQuery: string, tagFilter: string) => void;
  enforceClientForNonAdmin: (selectedClient: string | null, handleClientChange: (clientId: string | null) => void) => void;
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  userRole: string;
  currentPage: number;
  baseHandleClientChange: (clientId: string | null) => void;
}

/**
 * Hook for handling gallery initialization and effect dependencies
 */
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
  userRole,
  currentPage,
  baseHandleClientChange
}: GalleryInitializationProps) => {
  // Reset filters when search/tag/tab changes
  useEffect(() => {
    resetPagination();
    
    updateRandomFetchMode(searchQuery, tagFilter, activeTab, selectedProject, userRole, selectedClient);
    
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus, selectedClient, selectedProject, userRole, updateRandomFetchMode, resetPagination]);

  // Enforce client selection for non-admin users
  useEffect(() => {
    enforceClientForNonAdmin(selectedClient, baseHandleClientChange);
  }, [userRole, baseHandleClientChange, selectedClient, enforceClientForNonAdmin]);
  
  return {
    // This hook is purely for side effects, no need to return anything
  };
};
