import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useGalleryRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    console.log('🔄 Setting up gallery realtime listeners...');

    // Listen to image changes with targeted invalidation
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
          
          // Targeted invalidation based on the changed image
          const imageId = (payload.new as any)?.id || (payload.old as any)?.id;
          const projectId = (payload.new as any)?.id_projet || (payload.old as any)?.id_projet;
          
          if (imageId) {
            console.log(`🎯 Targeted cache invalidation for image: ${imageId}`);
            queryClient.invalidateQueries({
              predicate: (query) => {
                const keyString = JSON.stringify(query.queryKey);
                return (keyString.includes('gallery-images') || keyString.includes('gallery-images-count')) &&
                       (keyString.includes(imageId) || keyString.includes(projectId));
              }
            });
          } else {
            // Fallback to broader invalidation if no ID available
            console.log('⚠️ No image ID in payload, using broader invalidation');
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = JSON.stringify(query.queryKey);
                return key.includes('gallery-images') || key.includes('gallery-images-count');
              }
            });
          }
        }
      )
      .subscribe();

    // Listen to project changes with targeted invalidation
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
          
          const projectId = (payload.new as any)?.id || (payload.old as any)?.id;
          
          if (projectId) {
            console.log(`🎯 Targeted cache invalidation for project: ${projectId}`);
            // Invalidate project and gallery queries related to this project
            queryClient.invalidateQueries({
              predicate: (query) => {
                const keyString = JSON.stringify(query.queryKey);
                return (keyString.includes('projects') || keyString.includes('gallery-images') || keyString.includes('gallery-images-count')) &&
                       keyString.includes(projectId);
              }
            });
          } else {
            // Fallback to broader invalidation
            console.log('⚠️ No project ID in payload, using broader invalidation');
            queryClient.invalidateQueries({
              predicate: (query) => {
                const key = JSON.stringify(query.queryKey);
                return key.includes('projects') || key.includes('gallery-images');
              }
            });
          }
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