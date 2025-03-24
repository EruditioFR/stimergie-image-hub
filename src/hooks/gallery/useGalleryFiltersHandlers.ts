
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface FilterHandlersProps {
  baseHandleClientChange: (clientId: string | null) => void;
  baseHandleProjectChange: (projectId: string | null) => void;
  cancelPreviousRequest: () => void;
  setPreviousRequest: (searchQuery: string, tagFilter: string, activeTab: string, selectedClient: string | null, selectedProject: string | null, page: number, randomMode: boolean, userRole: string, userClientId: string | null) => void;
  resetPagination: (useRandomMode?: boolean) => void;
  canChangeClient: () => boolean;
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  userRole: string;
  userClientId: string | null;
}

export const useGalleryFiltersHandlers = ({
  baseHandleClientChange,
  baseHandleProjectChange,
  cancelPreviousRequest,
  setPreviousRequest,
  resetPagination,
  canChangeClient,
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  userRole,
  userClientId
}: FilterHandlersProps) => {
  
  // Gestionnaire de changement de client optimisé
  const handleClientChange = useCallback((clientId: string | null) => {
    if (!canChangeClient()) {
      console.log('Non-admin users cannot change their client filter');
      return;
    }
    
    cancelPreviousRequest();
    baseHandleClientChange(clientId);
    resetPagination(false);
    
    setPreviousRequest(
      searchQuery, 
      tagFilter, 
      activeTab, 
      clientId,
      null, 
      1, 
      false,
      userRole,
      userClientId
    );
  }, [baseHandleClientChange, cancelPreviousRequest, setPreviousRequest, resetPagination, canChangeClient, searchQuery, tagFilter, activeTab, userRole, userClientId]);
  
  // Gestionnaire de changement de projet optimisé
  const handleProjectChange = useCallback((projectId: string | null) => {
    cancelPreviousRequest();
    baseHandleProjectChange(projectId);
    resetPagination(false);
    
    setPreviousRequest(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      projectId, 
      1, 
      false,
      userRole,
      userClientId
    );
  }, [baseHandleProjectChange, cancelPreviousRequest, setPreviousRequest, resetPagination, searchQuery, tagFilter, activeTab, selectedClient, userRole, userClientId]);

  return {
    handleClientChange,
    handleProjectChange
  };
};
