
import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface FilterHandlersProps {
  baseHandleClientChange: (clientId: string | null) => void;
  baseHandleProjectChange: (projectId: string | null) => void;
  baseHandleOrientationChange: (orientation: string | null) => void;
  cancelPreviousRequest: () => void;
  setPreviousRequest: (searchQuery: string, tagFilter: string, activeTab: string, selectedClient: string | null, selectedProject: string | null, selectedOrientation: string | null, page: number, randomMode: boolean, userRole: string, userClientId: string | null) => void;
  resetPagination: (useRandomMode?: boolean) => void;
  canChangeClient: () => boolean;
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  selectedOrientation: string | null;
  userRole: string;
  userClientId: string | null;
}

export const useGalleryFiltersHandlers = ({
  baseHandleClientChange,
  baseHandleProjectChange,
  baseHandleOrientationChange,
  cancelPreviousRequest,
  setPreviousRequest,
  resetPagination,
  canChangeClient,
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  selectedOrientation,
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
      selectedOrientation,
      1, 
      false,
      userRole,
      userClientId
    );
  }, [baseHandleClientChange, cancelPreviousRequest, setPreviousRequest, resetPagination, canChangeClient, searchQuery, tagFilter, activeTab, selectedOrientation, userRole, userClientId]);
  
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
      selectedOrientation,
      1, 
      false,
      userRole,
      userClientId
    );
  }, [baseHandleProjectChange, cancelPreviousRequest, setPreviousRequest, resetPagination, searchQuery, tagFilter, activeTab, selectedClient, selectedOrientation, userRole, userClientId]);

  // Gestionnaire de changement d'orientation optimisé
  const handleOrientationChange = useCallback((orientation: string | null) => {
    cancelPreviousRequest();
    baseHandleOrientationChange(orientation);
    resetPagination(false);
    
    setPreviousRequest(
      searchQuery, 
      tagFilter, 
      activeTab, 
      selectedClient,
      selectedProject,
      orientation,
      1, 
      false,
      userRole,
      userClientId
    );
  }, [baseHandleOrientationChange, cancelPreviousRequest, setPreviousRequest, resetPagination, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, userRole, userClientId]);

  return {
    handleClientChange,
    handleProjectChange,
    handleOrientationChange
  };
};
