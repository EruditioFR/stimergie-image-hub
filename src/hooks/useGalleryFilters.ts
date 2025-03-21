
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export function useGalleryFilters() {
  const navigate = useNavigate();
  const { userRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [hasActiveFilters, setHasActiveFilters] = useState(false);
  const [userClientId, setUserClientId] = useState<string | null>(null);

  // Fetch user's client_id if they are admin_client
  useEffect(() => {
    const getUserClientId = async () => {
      if (userRole === 'admin_client' && user) {
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
            setSelectedClient(data);
          }
        } catch (error) {
          console.error('Error fetching user client ID:', error);
        }
      }
    };
    
    getUserClientId();
  }, [userRole, user]);

  const handleTabChange = useCallback((value: string) => {
    console.log('Tab changed to:', value);
    setActiveTab(value);
  }, []);

  const handleClientChange = useCallback((clientId: string | null) => {
    // Only allow client change for admin users
    if (userRole === 'admin_client') {
      console.log('Admin client users cannot change their client filter');
      return;
    }
    
    console.log('Client changed to:', clientId);
    setSelectedClient(clientId);
    // Reset project when client changes
    setSelectedProject(null);
  }, [userRole]);
  
  const handleProjectChange = useCallback((projectId: string | null) => {
    console.log('Project changed to:', projectId);
    setSelectedProject(projectId);
  }, []);

  const handleResetFilters = useCallback(() => {
    console.log('Resetting filters');
    setActiveTab('all');
    
    // For admin_client users, don't reset the client filter
    if (userRole !== 'admin_client') {
      setSelectedClient(null);
    }
    
    setSelectedProject(null);
    
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
      (selectedClient !== null && (userRole !== 'admin_client' || selectedClient !== userClientId)) ||
      selectedProject !== null
    );
  }, [activeTab, selectedClient, selectedProject, userRole, userClientId]);

  return {
    activeTab,
    selectedClient,
    selectedProject,
    hasActiveFilters,
    userClientId,
    userRole,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleResetFilters,
    updateFilterStatus
  };
}
