import { useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { formatImagesForGrid } from '@/utils/imageUtils';
import { useGalleryFilters } from './useGalleryFilters';
import { useAuth } from '@/context/AuthContext';
import { useGalleryClient } from './gallery/useGalleryClient';
import { useGalleryCache } from './gallery/useGalleryCache';
import { useGalleryPagination } from './gallery/useGalleryPagination';
import { useGalleryFiltersHandlers } from './gallery/useGalleryFiltersHandlers';
import { useGalleryQueryState } from './gallery/useGalleryQueryState';

export const useGalleryImages = (isAdmin: boolean) => {
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('q') || '';
  const tagFilter = searchParams.get('tag') || '';
  const { userRole, user } = useAuth();

  // Extraction des fonctionnalités dans des hooks spécialisés
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

  // Hook pour la pagination
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

  // Hook pour la gestion du cache
  const {
    cancelPreviousRequest,
    setPreviousRequest,
    fetchTotalCount,
    prefetchNextPage
  } = useGalleryCache();

  // Gestionnaires de filtres
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

  // État de la requête d'images
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

  // Réinitialisation des filtres et optimisation des requêtes
  useEffect(() => {
    resetPagination();
    
    // Modifier pour s'assurer de la récupération aléatoire lors du chargement initial sans filtres
    updateRandomFetchMode(searchQuery, tagFilter, activeTab, selectedProject, userRole, selectedClient);
    
    updateFilterStatus(searchQuery, tagFilter);
  }, [searchQuery, tagFilter, activeTab, updateFilterStatus, selectedClient, selectedProject, userRole, updateRandomFetchMode, resetPagination]);

  // Forcer le client_id pour les utilisateurs non-admin
  useEffect(() => {
    enforceClientForNonAdmin(selectedClient, baseHandleClientChange);
  }, [userRole, userClientId, baseHandleClientChange, selectedClient, enforceClientForNonAdmin]);

  // Récupération du nombre total optimisée
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

  // Préchargement de la page suivante
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
    return images.map(image => ({
      id: image.id.toString(),
      src: image.display_url || image.url_miniature || image.url,
      download_url: image.download_url,
      alt: image.title || "Image",
      title: image.title || "Sans titre",
      author: image.created_by || 'Utilisateur',
      tags: image.tags,
      orientation: image.orientation
    }));
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
