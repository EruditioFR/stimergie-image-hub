
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function useGalleryFilters() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);

  const handleTabChange = useCallback((value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
  }, []);

  const handleClientChange = useCallback((clientId: string | null) => {
    console.log('Client changed to:', clientId);
    setSelectedClient(clientId);
    // Reset project when client changes
    setSelectedProject(null);
  }, []);
  
  const handleProjectChange = useCallback((projectId: string | null) => {
    console.log('Project changed to:', projectId);
    setSelectedProject(projectId);
  }, []);

  const handleResetFilters = useCallback(() => {
    console.log('Resetting filters');
    setActiveTab('all');
    setSelectedClient(null);
    setSelectedProject(null);
    
    // Clear URL search params
    navigate('/gallery', { replace: true });
    
    // Reset filter state
    setHasActiveFilters(false);
  }, [navigate]);

  const updateFilterStatus = useCallback((searchQuery: string, tagFilter: string) => {
    setHasActiveFilters(
      searchQuery !== '' || 
      tagFilter !== '' || 
      activeTab.toLowerCase() !== 'all' ||
      selectedClient !== null ||
      selectedProject !== null
    );
  }, [activeTab, selectedClient, selectedProject]);

  return {
    activeTab,
    selectedClient,
    selectedProject,
    hasActiveFilters,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleResetFilters,
    updateFilterStatus
  };
}
