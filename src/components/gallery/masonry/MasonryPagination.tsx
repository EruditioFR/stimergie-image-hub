
import React from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';

interface MasonryPaginationProps {
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean; // Ajout d'un indicateur de chargement
}

export function MasonryPagination({
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  isLoading = false
}: MasonryPaginationProps) {
  if (!totalCount || totalCount <= 0 || !onPageChange) return null;

  const imagesPerPage = 200;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / imagesPerPage) : 0;

  // Si une seule page, ne pas afficher la pagination
  if (totalPages <= 1) return null;

  // Déterminer quelles pages afficher
  const getVisiblePages = () => {
    const pages = [];
    
    // Maximum 5 pages visibles
    if (totalPages <= 5) {
      // Moins de 5 pages, afficher toutes les pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Plus de 5 pages, logique avancée
      if (currentPage <= 3) {
        // Près du début: 1, 2, 3, 4, ..., totalPages
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Près de la fin: 1, ..., totalPages-3, totalPages-2, totalPages-1, totalPages
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        // Au milieu: 1, ..., currentPage-1, currentPage, currentPage+1, ..., totalPages
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page: number) => {
    if (isLoading || page === currentPage) return; // Éviter les clics multiples pendant le chargement
    onPageChange(page);
  };

  return (
    <div className="mt-8 mb-6">
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageClick(currentPage - 1)} 
                className={isLoading ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          )}
          
          {visiblePages.map((page, i) => {
            if (page === 'ellipsis') {
              return (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }
            
            return (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => handlePageClick(page)}
                  className={isLoading ? "pointer-events-none" : ""}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageClick(currentPage + 1)} 
                className={isLoading ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
