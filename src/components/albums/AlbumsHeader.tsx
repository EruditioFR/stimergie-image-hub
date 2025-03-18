
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface AlbumsHeaderProps {
  onRefresh?: () => void;
}

export function AlbumsHeader({ onRefresh }: AlbumsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
      <div>
        <h1 className="text-3xl font-bold">Albums partagés</h1>
        <p className="text-muted-foreground mt-1">
          Consultez tous les albums qui vous ont été partagés
        </p>
      </div>
      
      <div className="mt-4 sm:mt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>
    </div>
  );
}
