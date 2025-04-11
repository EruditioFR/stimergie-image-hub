
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface DownloadsHeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DownloadsHeader({ onRefresh, isRefreshing }: DownloadsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold">Vos téléchargements</h1>
        <p className="text-muted-foreground mt-2">
          Retrouvez ici toutes vos demandes de téléchargements.
        </p>
      </div>
      <Button 
        variant="outline" 
        onClick={onRefresh}
        className="flex items-center gap-2"
        disabled={isRefreshing}
      >
        {isRefreshing ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Actualisation...
          </>
        ) : (
          <>
            <RefreshCw className="h-4 w-4" />
            Actualiser
          </>
        )}
      </Button>
    </div>
  );
}
