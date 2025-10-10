
import React, { useState, KeyboardEvent } from 'react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronFirst, ChevronLast, Loader2 } from 'lucide-react';

interface MasonryPaginationProps {
  totalCount?: number;
  currentPage?: number;
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
}

export function MasonryPagination({
  totalCount = 0,
  currentPage = 1,
  onPageChange,
  isLoading = false
}: MasonryPaginationProps) {
  const [pageInput, setPageInput] = useState('');
  
  const imagesPerPage = 100;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / imagesPerPage) : 0;
  
  console.log('🔍 MasonryPagination Debug:', { 
    totalCount, 
    totalPages, 
    currentPage, 
    imagesPerPage 
  });
  
  if (!totalCount || totalCount <= 0 || !onPageChange) return null;

  // Afficher la pagination si totalPages > 1
  if (totalPages <= 1) return null;

  const startImage = (currentPage - 1) * imagesPerPage + 1;
  const endImage = Math.min(currentPage * imagesPerPage, totalCount);

  // Déterminer quelles pages afficher
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, 'ellipsis', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, 'ellipsis', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, 'ellipsis', currentPage - 1, currentPage, currentPage + 1, 'ellipsis', totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  const handlePageClick = (page: number) => {
    if (isLoading || page === currentPage || page < 1 || page > totalPages) return;
    onPageChange(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGoToPage = () => {
    const page = parseInt(pageInput);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      handlePageClick(page);
      setPageInput('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleGoToPage();
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-8 px-4">
      {/* Info sur les images affichées */}
      <div className="text-sm text-muted-foreground flex items-center gap-2">
        <span className="font-medium text-foreground">
          {startImage} - {endImage}
        </span>
        <span>sur</span>
        <span className="font-medium text-foreground">{totalCount}</span>
        <span>images</span>
        {totalPages > 1 && (
          <span className="text-xs ml-2 text-muted-foreground">
            (Page {currentPage}/{totalPages})
          </span>
        )}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin ml-2" />
        )}
      </div>

      {/* Navigation principale */}
      <Pagination>
        <PaginationContent className="gap-1">
          {/* Première page */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageClick(1)}
              disabled={currentPage === 1 || isLoading}
              className="h-9 w-9 p-0"
              title="Première page"
            >
              <ChevronFirst className="h-4 w-4" />
            </Button>
          </PaginationItem>

          {/* Page précédente */}
          {currentPage > 1 && (
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => handlePageClick(currentPage - 1)} 
                className={isLoading ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          )}
          
          {/* Numéros de page */}
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
                  onClick={() => handlePageClick(page as number)}
                  className={`${isLoading ? "pointer-events-none" : ""} ${
                    page === currentPage ? "bg-primary text-primary-foreground" : ""
                  }`}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}
          
          {/* Page suivante */}
          {currentPage < totalPages && (
            <PaginationItem>
              <PaginationNext 
                onClick={() => handlePageClick(currentPage + 1)} 
                className={isLoading ? "pointer-events-none opacity-50" : ""}
              />
            </PaginationItem>
          )}

          {/* Dernière page */}
          <PaginationItem>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageClick(totalPages)}
              disabled={currentPage === totalPages || isLoading}
              className="h-9 w-9 p-0"
              title="Dernière page"
            >
              <ChevronLast className="h-4 w-4" />
            </Button>
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Navigation rapide par saisie */}
      {totalPages > 10 && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Aller à la page :</span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`1-${totalPages}`}
            className="w-20 h-9 text-center"
            disabled={isLoading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToPage}
            disabled={isLoading || !pageInput}
            className="h-9"
          >
            Aller
          </Button>
        </div>
      )}
    </div>
  );
}
