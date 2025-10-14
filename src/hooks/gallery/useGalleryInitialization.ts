
import { useEffect } from 'react';
import { clearAccessibleProjectsCache } from '@/services/gallery/projectUtils';

interface GalleryInitializationProps {
  resetPagination: (useRandomMode?: boolean) => void;
  updateRandomFetchMode: (randomMode: boolean) => void;
  updateFilterStatus: (searchQuery: string, tagFilter: string) => void;
  userClientId: string | null;
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  selectedOrientation: string | null;
  userRole: string;
  currentPage: number;
  baseHandleClientChange: (clientId: string | null) => void;
  userId: string | null;
}

export const useGalleryInitialization = ({
  resetPagination,
  updateRandomFetchMode,
  updateFilterStatus,
  userClientId,
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  selectedOrientation,
  userRole,
  currentPage,
  baseHandleClientChange,
  userId
}: GalleryInitializationProps) => {

  // Clear cache when user changes to ensure fresh data
  useEffect(() => {
    if (userId) {
      console.log('🧹 Clearing accessible projects cache for user:', userId);
      clearAccessibleProjectsCache();
    }
  }, [userId]);

  // Enforce client filter for non-admin users SAUF si on a un filtre de tag
  useEffect(() => {
    const hasTagFilter = tagFilter && tagFilter.toLowerCase() !== 'toutes';
    
    // Si on a un filtre de tag, on n'applique pas le filtre client forcé
    if (!hasTagFilter && ['user', 'admin_client'].includes(userRole)) {
      if (selectedClient !== userClientId) {
        console.log(`Skipping client force to ${userClientId} for ${userRole} role; relying on effectiveClient`);
      }
    }
  }, [userClientId, userRole, selectedClient, baseHandleClientChange, tagFilter]);

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
    resetPagination,
    currentPage
  ]);

  return {};
};
