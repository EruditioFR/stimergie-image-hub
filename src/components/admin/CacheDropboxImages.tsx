
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export function CacheDropboxImages() {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCacheImages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('cache-dropbox-images', {
        body: { immediate: true }
      });
      
      if (error) throw error;
      
      toast.success('Mise en cache des images démarrée', {
        description: data.message
      });
      
    } catch (error) {
      console.error('Error caching images:', error);
      toast.error('Erreur lors de la mise en cache des images');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Button 
      onClick={handleCacheImages} 
      disabled={isLoading}
      variant="secondary"
      size="sm"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Mise en cache...
        </>
      ) : (
        'Mettre en cache les images Dropbox'
      )}
    </Button>
  );
}
