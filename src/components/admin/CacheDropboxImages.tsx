
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function CacheDropboxImages() {
  const [isLoading, setIsLoading] = useState(false);
  const [isInProgress, setIsInProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [details, setDetails] = useState<{
    total: number;
    processed: number;
    succeeded: number;
    failed: number;
    estimatedTimeRemaining: string;
  }>({
    total: 0,
    processed: 0,
    succeeded: 0,
    failed: 0,
    estimatedTimeRemaining: 'Calculating...'
  });
  
  // Check for existing progress on component mount
  useEffect(() => {
    checkProgress();
    
    // Poll for progress updates if operation is in progress
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
          estimatedTimeRemaining: data.estimatedTimeRemaining || 'Calculating...'
        });
      } else {
        setIsInProgress(false);
        setProgress(0);
      }
    } catch (error) {
      console.error('Error checking progress:', error);
    }
  };
  
  const handleCacheImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cache-dropbox-images', {
        body: { immediate: true }
      });
      
      if (error) throw error;
      
      if (data.inProgress) {
        setIsInProgress(true);
        setDetails({ ...details, total: data.total || 0 });
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
  
  return (
    <div className="flex flex-col gap-2 w-full max-w-md">
      <Button 
        onClick={handleCacheImages} 
        disabled={isLoading || isInProgress}
        variant="secondary"
        size="sm"
        className="self-end"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Initialisation...
          </>
        ) : isInProgress ? (
          "Mise en cache en cours..."
        ) : (
          'Mettre en cache les images Dropbox'
        )}
      </Button>
      
      {isInProgress && (
        <div className="mt-2 space-y-2 p-3 border rounded-md bg-secondary/20">
          <div className="flex justify-between text-sm">
            <span>Progression:</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
          
          <div className="text-xs text-muted-foreground mt-2 space-y-1">
            <p>Images traitées: {details.processed} / {details.total}</p>
            <p>Réussies: {details.succeeded} | Échouées: {details.failed}</p>
            <p>Temps restant estimé: {details.estimatedTimeRemaining}</p>
          </div>
        </div>
      )}
    </div>
  );
}
