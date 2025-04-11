
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { DownloadsTable, DownloadRequest } from './DownloadsTable';

interface DownloadsContentProps {
  isLoading: boolean;
  error: Error | null;
  downloads: DownloadRequest[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function DownloadsContent({ isLoading, error, downloads, onRefresh, isRefreshing }: DownloadsContentProps) {
  return (
    <div className="bg-card rounded-lg border p-6">
      <h2 className="text-xl font-semibold mb-4">Historique des demandes</h2>
      
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>
            Une erreur est survenue lors du chargement des téléchargements.
            <p className="text-sm mt-1">{error.message}</p>
            <Button 
              variant="link" 
              onClick={onRefresh} 
              className="p-0 h-auto text-primary underline mt-2"
              disabled={isRefreshing}
            >
              Essayer à nouveau
            </Button>
          </AlertDescription>
        </Alert>
      ) : (
        <DownloadsTable downloads={downloads} onRefresh={onRefresh} />
      )}
    </div>
  );
}
