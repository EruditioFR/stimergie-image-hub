
import { Button } from '@/components/ui/button';

interface EmptyResultsProps {
  onReset: () => void;
}

export function EmptyResults({ onReset }: EmptyResultsProps) {
  return (
    <div className="text-center py-20">
      <h3 className="text-xl font-medium mb-2">Aucun résultat trouvé</h3>
      <p className="text-muted-foreground mb-8">
        Essayez d'autres termes de recherche ou explorez nos catégories
      </p>
      <Button 
        variant="outline"
        onClick={onReset}
      >
        Voir toutes les images
      </Button>
    </div>
  );
}
