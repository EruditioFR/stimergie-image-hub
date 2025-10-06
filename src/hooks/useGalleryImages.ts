
import { useSearchParams } from 'react-router-dom';
import { useGalleryFilters } from './useGalleryFilters';
import { useAuth } from '@/context/AuthContext';
import { useGalleryCache } from './gallery/useGalleryCache';
import { useGalleryPagination } from './gallery/useGalleryPagination';
import { useGalleryFiltersHandlers } from './gallery/useGalleryFiltersHandlers';
import { useGalleryQueryState } from './gallery/useGalleryQueryState';
import { useGalleryImageFormatting } from './gallery/useGalleryImageFormatting';
import { useGalleryInitialization } from './gallery/useGalleryInitialization';
import { useGalleryDataFetching } from './gallery/useGalleryDataFetching';

export const useGalleryImages = (isAdmin: boolean) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const { userRole, user, userClientId } = useAuth();

  // Only admin users can change the client filter
  const canChangeClient = () => userRole === 'admin';
  
  const {
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    hasActiveFilters,
    handleTabChange,
    handleClientChange: baseHandleClientChange,
    handleProjectChange: baseHandleProjectChange,
    handleOrientationChange: baseHandleOrientationChange,
    handleResetFilters,
    updateFilterStatus
  } = useGalleryFilters();

  const {
    currentPage,
    totalCount,
    shouldFetchRandom,
    setTotalCount,
    handlePageChange,
    resetPagination,
    updateRandomFetchMode
  } = useGalleryPagination({
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    userRole,
    userClientId
  });

  const {
    cancelPreviousRequest,
    setPreviousRequest,
    fetchTotalCount,
    prefetchNextPage,
    invalidateGalleryData,
    invalidateClientData
  } = useGalleryCache();

  const {
    handleClientChange,
    handleProjectChange,
    handleOrientationChange
  } = useGalleryFiltersHandlers({
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
  });

  const {
    allImages,
    isLoading,
    isFetching,
    refreshGallery,
    hasMorePages
  } = useGalleryQueryState({
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    currentPage,
    shouldFetchRandom,
    userRole,
    userClientId,
    userId: user?.id || null
  });

  // Use the extracted image formatting hook
  const { formatImagesForGrid } = useGalleryImageFormatting();

  // Use the initialization hook for side effects
  useGalleryInitialization({
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
    baseHandleClientChange
  });

  // Use the data fetching hook for side effects
  useGalleryDataFetching({
    fetchTotalCount,
    prefetchNextPage,
    isLoading,
    isFetching,
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    currentPage,
    totalCount,
    userRole,
    userClientId,
    userId: user?.id || null,
    shouldFetchRandom,
    setTotalCount
  });

  // Fonction pour rafraîchir la galerie avec invalidation de cache
  const refreshGalleryWithCacheInvalidation = async () => {
    console.log('Refreshing gallery with cache invalidation...');
    
    // Invalider les caches
    await invalidateGalleryData();
    
    // Rafraîchir la galerie
    refreshGallery();
  };

  return {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    selectedProject,
    selectedOrientation,
    currentPage,
    totalCount,
    handlePageChange,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleOrientationChange,
    handleResetFilters,
    refreshGallery: refreshGalleryWithCacheInvalidation,
    formatImagesForGrid,
    userRole,
    userClientId,
    shouldFetchRandom,
    hasMorePages,
    // Exposer les méthodes de cache pour usage externe
    invalidateGalleryData,
    invalidateClientData
  };
};
