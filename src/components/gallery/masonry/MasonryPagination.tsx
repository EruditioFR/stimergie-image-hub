
import React from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

interface MasonryPaginationProps {
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
}

export function MasonryPagination({
  totalCount = 0,
  currentPage = 1,
  onPageChange
}: MasonryPaginationProps) {
  if (!totalCount || totalCount <= 0 || !onPageChange) return null;

  const imagesPerPage = 50; // Changed from 15 to 50
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / imagesPerPage) : 0;

  return (
    <div className="mt-8 mb-6">
      <Pagination>
        <PaginationContent>
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious onClick={() => onPageChange(currentPage - 1)} />
            </PaginationItem>
          )}
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNumber;
            
            // Logique pour afficher les bons numéros de page
            if (totalPages <= 5) {
              // Si on a 5 pages ou moins, on les affiche toutes
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              // Si on est au début, on affiche 1, 2, 3, 4, 5
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              // Si on est à la fin, on affiche les 5 dernières pages
              pageNumber = totalPages - 4 + i;
            } else {
              // Sinon on affiche 2 pages avant et 2 pages après la page actuelle
              pageNumber = currentPage - 2 + i;
            }
            
            return (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  isActive={pageNumber === currentPage}
                  onClick={() => onPageChange(pageNumber)}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext onClick={() => onPageChange(currentPage + 1)} />
            </PaginationItem>
          )}
        </PaginationContent>
      </Pagination>
    </div>
  );
}
