import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { clearAllCaches } from '@/utils/image/cacheManager';

export const useGalleryRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 Setting up gallery realtime listeners...');

    // Listen to image changes
    const imagesChannel = supabase
      .channel('images-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'images'
        },
        (payload) => {
          console.log('📸 Image changed:', payload);
          
          // Invalidate all gallery-related queries
          queryClient.invalidateQueries({
            predicate: (query) => {
              const key = JSON.stringify(query.queryKey);
              return key.includes('gallery') || key.includes('images');
            }
          });

          // Clear image caches
          clearAllCaches();
        }
      )
      .subscribe();

    // Listen to project changes
    const projectsChannel = supabase
      .channel('projects-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projets'
        },
        (payload) => {
          console.log('📁 Project changed:', payload);
          
          // Invalidate project and gallery queries
          queryClient.invalidateQueries({
            predicate: (query) => {
              const key = JSON.stringify(query.queryKey);
              return key.includes('projects') || key.includes('gallery');
            }
          });

          clearAllCaches();
        }
      )
      .subscribe();

    return () => {
      console.log('🛑 Cleaning up gallery realtime listeners...');
      supabase.removeChannel(imagesChannel);
      supabase.removeChannel(projectsChannel);
    };
  }, [queryClient]);

  return null;
};