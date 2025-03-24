
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { generateCacheKey } from '@/services/galleryService';

interface PaginationProps {
  searchQuery: string;
  tagFilter: string;
  activeTab: string;
  selectedClient: string | null;
  selectedProject: string | null;
  userRole: string;
  userClientId: string | null;
}

export const useGalleryPagination = ({
  searchQuery,
  tagFilter,
  activeTab,
  selectedClient,
  selectedProject,
  userRole,
  userClientId
}: PaginationProps) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [shouldFetchRandom, setShouldFetchRandom] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Gestionnaire de changement de page optimisé pour la pagination
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage === page) return; // Éviter les appels inutiles
    console.log('Page changed from', page, 'to', newPage);
    setPage(newPage);
  }, [page]);

  // Réinitialiser les pages et le mode aléatoire
  const resetPagination = useCallback((useRandomMode: boolean = false) => {
    setPage(1);
    setShouldFetchRandom(useRandomMode);
  }, []);

  // Vérifie si on peut utiliser le mode aléatoire
  const updateRandomFetchMode = useCallback((searchQuery: string, tagFilter: string, activeTab: string, selectedProject: string | null, userRole: string, selectedClient: string | null) => {
    const noFilters = !searchQuery && !tagFilter && activeTab === 'all' && !selectedProject;
    const canUseRandom = noFilters && (userRole === 'admin' || selectedClient !== null);
    
    console.log('Setting shouldFetchRandom to:', canUseRandom);
    setShouldFetchRandom(canUseRandom);
  }, []);

  return {
    currentPage: page,
    totalCount,
    shouldFetchRandom,
    setTotalCount,
    handlePageChange,
    resetPagination,
    updateRandomFetchMode
  };
};
