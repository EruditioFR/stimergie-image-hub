import { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useGalleryFilters() {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const [searchParams] = useSearchParams();
  const tagFilter = searchParams.get('tag') || '';
  
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedOrientation, setSelectedOrientation] = useState<string | null>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [userClientId, setUserClientId] = useState<string | null>(null);
  const [userClientIds, setUserClientIds] = useState<string[]>([]);

  // Fetch user's client_ids for regular users and admin_client
  useEffect(() => {
    const getUserClientIds = async () => {
      if ((userRole === 'user' || userRole === 'admin_client') && user) {
        try {
          const { data, error } = await supabase.rpc('get_user_client_ids', {
            user_id: user.id
          });
          
          if (error) {
            console.error('Error fetching user client IDs:', error);
            return;
          }
          
          if (data && data.length > 0) {
            setUserClientIds(data);
            // Set the first one for backward compatibility
            setUserClientId(data[0]);
            
            // Auto-sélectionner le client seulement si l'utilisateur n'a qu'un seul client
            if (data.length === 1) {
              setSelectedClient(data[0]);
            }
          }
        } catch (error) {
          console.error('Error fetching user client IDs:', error);
        }
      }
    };
    
    getUserClientIds();
  }, [userRole, user]);

  // Synchronize client filter with URL parameter (admin only)
  useEffect(() => {
    const urlClient = searchParams.get('client');
    if (urlClient && urlClient !== selectedClient && userRole === 'admin') {
      console.log('Synchronizing client filter from URL:', urlClient);
      setSelectedClient(urlClient);
      setSelectedProject(null); // Clear project when client changes from URL
    }
  }, [searchParams, userRole]);

  const handleTabChange = useCallback((value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
  }, []);

  const handleClientChange = useCallback((clientId: string | null) => {
    // Autoriser le changement pour les utilisateurs avec plusieurs clients
    const hasMultipleClients = userClientIds.length > 1;
    
    if ((userRole === 'user' || userRole === 'admin_client') && !hasMultipleClients) {
      console.log('Non-admin users with single client cannot change their client filter');
      return;
    }
    
    console.log('Client changed to:', clientId);
    setSelectedClient(clientId);
    
    // Clear project selection when client changes - the project will be auto-selected
    // in the ProjectsFilter component when the projects are loaded
    setSelectedProject(null);
  }, [userRole, userClientIds]);
  
  const handleProjectChange = useCallback((projectId: string | null) => {
    console.log('Project changed to:', projectId);
    setSelectedProject(projectId);
  }, []);

  const handleOrientationChange = useCallback((orientation: string | null) => {
    console.log('Orientation changed to:', orientation);
    setSelectedOrientation(orientation);
  }, []);

  const handleResetFilters = useCallback(() => {
    console.log('Resetting filters');
    setActiveTab('all');
    
    // For regular users and admin_client, don't reset the client filter
    if (userRole !== 'admin') {
      // Keep the client filter for non-admin users
    } else {
      setSelectedClient(null);
    }
    
    setSelectedProject(null);
    setSelectedOrientation(null);
    
    // Clear URL search params
    navigate('/gallery', { replace: true });
    
    // Reset filter state
    setHasActiveFilters(false);
  }, [navigate, userRole]);

  const updateFilterStatus = useCallback((searchQuery: string, tagFilter: string) => {
    setHasActiveFilters(
      searchQuery !== '' || 
      tagFilter !== '' || 
      activeTab.toLowerCase() !== 'all' ||
      (selectedClient !== null && (userRole === 'admin')) ||
      selectedProject !== null ||
      selectedOrientation !== null
    );
  }, [activeTab, selectedClient, selectedProject, selectedOrientation, userRole]);

  return {
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    hasActiveFilters,
    userClientId,
    userClientIds,
    userRole,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleOrientationChange,
    handleResetFilters,
    updateFilterStatus
  };
}
