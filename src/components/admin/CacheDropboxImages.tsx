
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, Clock, Check, XCircle, Trash2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { clearAllCaches } from '@/utils/image/cacheManager';

export function CacheDropboxImages() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);
  const [isFlushing, setIsFlushing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [details, setDetails] = useState<{
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    estimatedTimeRemaining: string;
    averageSpeed: string;
  }>({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    estimatedTimeRemaining: 'Calcul en cours...',
    averageSpeed: '0 img/min'
  });
  
  // Vérifier la progression existante au montage du composant
  useEffect(() => {
    checkProgress();
    
    // Interroger les mises à jour de progression si l'opération est en cours
    let interval: number | null = null;
    
    if (isInProgress) {
      interval = window.setInterval(checkProgress, 3000);
    }
    
    return () => {
      if (interval !== null) {
        clearInterval(interval);
      }
    };
  }, [isInProgress]);
  
  // Vérifier la progression actuelle
  const checkProgress = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('cache-dropbox-images', {
        body: { checkProgress: true }
      });
      
      if (error) throw error;
      
      if (data.inProgress) {
        setIsInProgress(true);
        setProgress(data.percent || 0);
        setDetails({
          total: data.total || 0,
          processed: data.processed || 0,
          succeeded: data.succeeded || 0,
          failed: data.failed || 0,
          estimatedTimeRemaining: data.estimatedTimeRemaining || 'Calcul en cours...',
          averageSpeed: data.averageSpeed || '0 img/min'
        });
      } else {
        setIsInProgress(false);
        setProgress(0);
      }
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };
  
  // Lancer le processus de mise en cache
  const handleCacheImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cache-dropbox-images', {
        body: { immediate: true }
      });
      
      if (error) throw error;
      
      if (data.inProgress) {
        setIsInProgress(true);
        setDetails(prev => ({ ...prev, total: data.total || 0 }));
        toast.success('Mise en cache des images démarrée', {
          description: data.message
        });
      }
      
    } catch (error) {
      console.error('Error caching images:', error);
      toast.error('Erreur lors de la mise en cache des images');
      setIsInProgress(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Vider tous les caches d'images
  const handleFlushCache = () => {
    setIsFlushing(true);
    try {
      clearAllCaches();
      toast.success('Tous les caches d\'images ont été vidés');
    } catch (error) {
      console.error('Error flushing image caches:', error);
      toast.error('Erreur lors du vidage des caches d\'images');
    } finally {
      setIsFlushing(false);
    }
  };
  
  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <div className="flex gap-2 self-end">
        <Button 
          onClick={handleFlushCache}
          disabled={isFlushing}
          variant="outline"
          size="sm"
          className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          {isFlushing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Vidage...
            </>
          ) : (
            <>
              <Trash2 className="h-4 w-4 mr-2" />
              Vider le cache
            </>
          )}
        </Button>
        
        <Button 
          onClick={handleCacheImages} 
          disabled={isLoading || isInProgress}
          variant="secondary"
          size="sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Initialisation...
            </>
          ) : isInProgress ? (
            "Mise en cache en cours..."
          ) : (
            <>
              <ImageIcon className="h-4 w-4 mr-2" />
              Mettre en cache les images
            </>
          )}
        </Button>
      </div>
      
      {isInProgress && (
        <div className="mt-2 space-y-3 p-4 border rounded-md bg-secondary/20">
          <div className="flex justify-between text-sm">
            <span>Progression:</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mt-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">{details.total}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              <span className="text-muted-foreground">Temps restant:</span>
              <span className="font-medium whitespace-nowrap">{details.estimatedTimeRemaining}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">Réussies:</span>
              <span className="font-medium">{details.succeeded}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-muted-foreground">Échouées:</span>
              <span className="font-medium">{details.failed}</span>
            </div>
          </div>
          
          <div className="text-xs text-center text-muted-foreground pt-1 border-t">
            <p>Vitesse moyenne: {details.averageSpeed}</p>
          </div>
        </div>
      )}
    </div>
  );
}
