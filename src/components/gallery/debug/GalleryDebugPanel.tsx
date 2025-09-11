import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQueryClient } from '@tanstack/react-query';
import { clearAllCaches } from '@/utils/image/cacheManager';
import { useSmartCacheInvalidation } from '@/hooks/useSmartCacheInvalidation';
import { toast } from 'sonner';
import { RotateCcw, Trash2, Info } from 'lucide-react';

interface GalleryDebugPanelProps {
  onClose?: () => void;
}

export function GalleryDebugPanel({ onClose }: GalleryDebugPanelProps) {
  const queryClient = useQueryClient();
  const { invalidateImageCaches, diagnoseCache } = useSmartCacheInvalidation();

  const handleForceRefresh = async () => {
    try {
      console.log('🔄 Force refresh initiated...');
      toast.info('Rafraîchissement forcé en cours...');
      
      // Clear all caches
      clearAllCaches();
      
      // Invalidate all queries
      await queryClient.invalidateQueries();
      
      // Reload the page to ensure fresh data
      window.location.reload();
      
      toast.success('Cache vidé et page rechargée');
    } catch (error) {
      console.error('❌ Error during force refresh:', error);
      toast.error('Erreur lors du rafraîchissement');
    }
  };

  const handleClearImageCaches = async () => {
    try {
      console.log('🧹 Clearing image caches...');
      toast.info('Vidage des caches d\'images...');
      
      await invalidateImageCaches();
      
      toast.success('Caches d\'images vidés');
    } catch (error) {
      console.error('❌ Error clearing image caches:', error);
      toast.error('Erreur lors du vidage des caches');
    }
  };

  const handleDiagnoseCache = () => {
    const diagnosis = diagnoseCache();
    console.log('📊 Cache diagnosis:', diagnosis);
    toast.info(`Cache: ${diagnosis.totalQueries} requêtes, ${diagnosis.galleryQueries} galerie`);
  };

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 bg-background/95 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Debug Gallery Cache
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleForceRefresh}
          className="w-full"
          variant="destructive"
          size="sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Rafraîchissement complet
        </Button>
        
        <Button 
          onClick={handleClearImageCaches}
          className="w-full"
          variant="outline"
          size="sm"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Vider caches images
        </Button>
        
        <Button 
          onClick={handleDiagnoseCache}
          className="w-full"
          variant="secondary"
          size="sm"
        >
          <Info className="w-4 h-4 mr-2" />
          Diagnostic cache
        </Button>
        
        <div className="text-xs text-muted-foreground mt-3 p-2 bg-muted/50 rounded">
          <p><strong>Cache times:</strong></p>
          <p>• React Query: 15s</p>
          <p>• Gallery cache: 3min</p>
          <p>• Realtime sync: Enabled</p>
        </div>
      </CardContent>
    </Card>
  );
}