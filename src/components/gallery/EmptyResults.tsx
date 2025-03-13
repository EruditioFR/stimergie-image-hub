
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface EmptyResultsProps {
  onReset: () => void;
  hasFilters: boolean;
}

export function EmptyResults({ onReset, hasFilters }: EmptyResultsProps) {
  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-medium mb-2">Aucun résultat trouvé</h3>
      <p className="text-muted-foreground mb-8">
        {hasFilters 
          ? "Aucune image ne correspond aux filtres sélectionnés"
          : "Essayez d'autres termes de recherche ou explorez nos catégories"}
      </p>
      <Button 
        variant="outline"
        onClick={onReset}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Voir toutes les images
      </Button>
    </div>
  );
}
