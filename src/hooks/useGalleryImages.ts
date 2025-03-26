
import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useGalleryFilters } from './useGalleryFilters';
import { useAuth } from '@/context/AuthContext';
import { useGalleryClient } from './gallery/useGalleryClient';
import { useGalleryCache } from './gallery/useGalleryCache';
import { useGalleryPagination } from './gallery/useGalleryPagination';
import { useGalleryFiltersHandlers } from './gallery/useGalleryFiltersHandlers';
import { useGalleryQueryState } from './gallery/useGalleryQueryState';
import { Image } from '@/utils/image/types';

export const useGalleryImages = (isAdmin: boolean) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const { userRole, user } = useAuth();

  const { userClientId, enforceClientForNonAdmin, canChangeClient } = useGalleryClient(user, userRole);
  
  const {
    activeTab,
    selectedClient,
    selectedProject,
    hasActiveFilters,
    handleTabChange,
    handleClientChange: baseHandleClientChange,
    handleProjectChange: baseHandleProjectChange,
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
    userRole,
    userClientId
  });

  const {
    cancelPreviousRequest,
    setPreviousRequest,
    fetchTotalCount,
    prefetchNextPage
  } = useGalleryCache();

  const {
    handleClientChange,
    handleProjectChange
  } = useGalleryFiltersHandlers({
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
  });

  const {
    allImages,
    isLoading,
    isFetching,
    refreshGallery
  } = useGalleryQueryState({
    searchQuery,
    tagFilter,
    activeTab,
    selectedClient,
    selectedProject,
    currentPage,
    shouldFetchRandom,
    userRole,
    userClientId
  });

  useEffect(() => {
    resetPagination();
    
    updateRandomFetchMode(searchQuery, tagFilter, activeTab, selectedProject, userRole, selectedClient);
    
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus, selectedClient, selectedProject, userRole, updateRandomFetchMode, resetPagination]);

  useEffect(() => {
    enforceClientForNonAdmin(selectedClient, baseHandleClientChange);
  }, [userRole, userClientId, baseHandleClientChange, selectedClient, enforceClientForNonAdmin]);

  useEffect(() => {
    if (isFetching || isLoading) return;
    fetchTotalCount(
      searchQuery,
      tagFilter,
      activeTab,
      selectedClient,
      selectedProject,
      userRole,
      userClientId,
      totalCount,
      setTotalCount
    );
  }, [fetchTotalCount, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, isFetching, isLoading, totalCount, userRole, userClientId, setTotalCount]);

  useEffect(() => {
    prefetchNextPage(
      isLoading,
      isFetching,
      shouldFetchRandom,
      searchQuery,
      tagFilter,
      activeTab,
      selectedClient,
      selectedProject,
      currentPage,
      totalCount,
      userRole,
      userClientId
    );
  }, [prefetchNextPage, isLoading, isFetching, shouldFetchRandom, searchQuery, tagFilter, activeTab, selectedClient, selectedProject, currentPage, totalCount, userRole, userClientId]);

  const formatImagesForGrid = useCallback((images: any[] = []) => {
    return images.map(image => {
      // Utiliser directement les URLs générées par le service
      const srcUrl = image.display_url || '';
      const downloadUrl = image.download_url || '';

      return {
        id: image.id.toString(),
        src: srcUrl,
        download_url: downloadUrl,
        display_url: srcUrl,
        alt: image.title || "Image sans titre",
        title: image.title || "Sans titre",
        author: image.created_by || 'Utilisateur',
        tags: image.tags || [],
        orientation: image.orientation || 'landscape',
        // Conserver pour rétrocompatibilité
        url_miniature: image.url_miniature || null,
        url: image.url || null
      } as Image;
    });
  }, []);

  return {
    allImages,
    isLoading,
    isFetching,
    hasActiveFilters,
    activeTab,
    selectedClient,
    selectedProject,
    currentPage,
    totalCount,
    handlePageChange,
    handleTabChange,
    handleClientChange,
    handleProjectChange,
    handleResetFilters,
    refreshGallery,
    formatImagesForGrid,
    userRole,
    userClientId,
    shouldFetchRandom
  };
};
