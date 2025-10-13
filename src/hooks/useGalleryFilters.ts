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

  // Fetch user's client_id for regular users and admin_client
  useEffect(() => {
    const getUserClientId = async () => {
      if ((userRole === 'user' || userRole === 'admin_client') && user) {
        try {
          const { data, error } = await supabase.rpc('get_user_client_id', {
            user_id: user.id
          });
          
          if (error) {
            console.error('Error fetching user client ID:', error);
            return;
          }
          
          if (data) {
            setUserClientId(data);
            // Auto-sélectionner le client pour les utilisateurs réguliers et admin_client
            if (userRole === 'user' || userRole === 'admin_client') {
              setSelectedClient(data);
            }
          }
        } catch (error) {
          console.error('Error fetching user client ID:', error);
        }
      }
    };
    
    getUserClientId();
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
    // Only allow client change for admin users
    if (userRole === 'user' || userRole === 'admin_client') {
      console.log('Non-admin users cannot change their client filter');
      return;
    }
    
    console.log('Client changed to:', clientId);
    setSelectedClient(clientId);
    
    // Clear project selection when client changes - the project will be auto-selected
    // in the ProjectsFilter component when the projects are loaded
    setSelectedProject(null);
  }, [userRole]);
  
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
    userRole,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleOrientationChange,
    handleResetFilters,
    updateFilterStatus
  };
}
