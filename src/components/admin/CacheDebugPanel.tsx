
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Trash2, RefreshCw, Database, Eye } from 'lucide-react';
import { clearAllCaches } from '@/utils/image/cacheManager';

interface CacheStats {
  reactQueryKeys: string[];
  sessionStorageCount: number;
  localStorageCount: number;
  memoryFetchCacheSize: number;
  processedUrlCacheSize: number;
}

export const CacheDebugPanel = () => {
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectData, setProjectData] = useState<any>(null);
  const queryClient = useQueryClient();

  // ID du projet problématique
  const PROBLEMATIC_PROJECT_ID = '4949c2d4-90f4-44e8-b346-443cd82d9792';

  const analyzeCacheState = () => {
    console.log('🔍 Analyzing cache state...');
    
    // Analyser React Query cache
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();
    const reactQueryKeys = queries.map(q => JSON.stringify(q.queryKey));
    
    // Analyser session storage
    let sessionStorageCount = 0;
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('img_cache_')) {
          sessionStorageCount++;
        }
      }
    } catch (e) {
      console.warn('Cannot access session storage:', e);
    }
    
    // Analyser local storage (seulement les images, pas l'auth)
    let localStorageCount = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('global_img_cache_')) {
          localStorageCount++;
        }
      }
    } catch (e) {
      console.warn('Cannot access local storage:', e);
    }
    
    // Analyser les caches mémoire (importés depuis cacheManager)
    const { fetchCache, processedUrlCache } = require('@/utils/image/cacheManager');
    
    const stats: CacheStats = {
      reactQueryKeys: reactQueryKeys.filter(key => key.includes('gallery')),
      sessionStorageCount,
      localStorageCount,
      memoryFetchCacheSize: fetchCache.size,
      processedUrlCacheSize: processedUrlCache.size
    };
    
    setCacheStats(stats);
    console.log('📊 Cache stats:', stats);
  };

  const checkProjectInDatabase = async () => {
    setIsLoading(true);
    try {
      console.log(`🔍 Checking project ${PROBLEMATIC_PROJECT_ID} in database...`);
      
      // Vérifier le projet
      const { data: project, error: projectError } = await supabase
        .from('projets')
        .select('*')
        .eq('id', PROBLEMATIC_PROJECT_ID)
        .single();
      
      if (projectError) {
        console.error('Project query error:', projectError);
        toast.error('Erreur lors de la vérification du projet');
        return;
      }
      
      // Vérifier les images de ce projet
      const { data: images, error: imagesError, count } = await supabase
        .from('images')
        .select('id, title, url, created_at', { count: 'exact' })
        .eq('id_projet', PROBLEMATIC_PROJECT_ID)
        .order('created_at', { ascending: false });
      
      if (imagesError) {
        console.error('Images query error:', imagesError);
        toast.error('Erreur lors de la vérification des images');
        return;
      }
      
      console.log(`📊 Found ${count} images for project:`, project);
      console.log('📸 Recent images:', images?.slice(0, 5));
      
      setProjectData({
        project,
        imageCount: count,
        recentImages: images?.slice(0, 10) || []
      });
      
      toast.success(`Projet trouvé avec ${count} images`);
    } catch (error) {
      console.error('Database check error:', error);
      toast.error('Erreur lors de la vérification');
    } finally {
      setIsLoading(false);
    }
  };

  const clearImageCachesOnly = async () => {
    setIsLoading(true);
    try {
      console.log('🧹 Clearing image caches only (preserving auth)...');
      
      // 1. Invalider seulement les requêtes liées aux images dans React Query
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = JSON.stringify(query.queryKey);
          return key.includes('gallery') || 
                 key.includes('images') || 
                 key.includes('projects') ||
                 key.includes('clients');
        }
      });
      
      // 2. Vider les caches d'images (pas l'auth)
      clearAllCaches();
      
      // 3. Actualiser les stats
      setTimeout(() => {
        analyzeCacheState();
        toast.success('Caches d\'images vidés (session préservée)');
      }, 100);
      
    } catch (error) {
      console.error('Error clearing image caches:', error);
      toast.error('Erreur lors du nettoyage du cache');
    } finally {
      setIsLoading(false);
    }
  };

  const forceRefreshProject = async () => {
    setIsLoading(true);
    try {
      console.log(`🔄 Force refreshing project ${PROBLEMATIC_PROJECT_ID}...`);
      
      // Invalider spécifiquement les caches de ce projet
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = JSON.stringify(query.queryKey);
          return key.includes(PROBLEMATIC_PROJECT_ID);
        }
      });
      
      // Précharger les données du projet
      await queryClient.prefetchQuery({
        queryKey: ['gallery-images', '', '', 'all', null, PROBLEMATIC_PROJECT_ID, 1, false, 'admin', null],
        queryFn: async () => {
          const { fetchGalleryImages } = await import('@/services/gallery/imageService');
          return fetchGalleryImages('', '', 'all', null, PROBLEMATIC_PROJECT_ID, 1, false, 'admin', null, null);
        }
      });
      
      toast.success('Projet actualisé');
      
    } catch (error) {
      console.error('Error force refreshing project:', error);
      toast.error('Erreur lors de l\'actualisation');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    analyzeCacheState();
  }, []);

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Debug Cache - Projet {PROBLEMATIC_PROJECT_ID.slice(0, 8)}...
        </CardTitle>
        <CardDescription>
          Diagnostic et nettoyage des caches d'images (préserve l'authentification)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Actions principales */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={analyzeCacheState} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Analyser Cache
          </Button>
          <Button onClick={checkProjectInDatabase} disabled={isLoading} size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Vérifier BDD
          </Button>
          <Button onClick={clearImageCachesOnly} disabled={isLoading} variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Vider Cache Images
          </Button>
          <Button onClick={forceRefreshProject} disabled={isLoading} variant="secondary" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser Projet
          </Button>
        </div>

        {/* Stats du cache */}
        {cacheStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded">
              <div className="text-sm font-medium">React Query</div>
              <div className="text-2xl font-bold">{cacheStats.reactQueryKeys.length}</div>
              <div className="text-xs text-muted-foreground">requêtes galerie</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium">Session Storage</div>
              <div className="text-2xl font-bold">{cacheStats.sessionStorageCount}</div>
              <div className="text-xs text-muted-foreground">images</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium">Local Storage</div>
              <div className="text-2xl font-bold">{cacheStats.localStorageCount}</div>
              <div className="text-xs text-muted-foreground">images globales</div>
            </div>
            <div className="p-3 border rounded">
              <div className="text-sm font-medium">Mémoire</div>
              <div className="text-2xl font-bold">{cacheStats.memoryFetchCacheSize}</div>
              <div className="text-xs text-muted-foreground">fetch cache</div>
            </div>
          </div>
        )}

        {/* Données du projet */}
        {projectData && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Données du Projet</h3>
            <div className="p-4 border rounded bg-muted/50">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <strong>Nom:</strong> {projectData.project.nom_projet}
                </div>
                <div>
                  <strong>Dossier:</strong> {projectData.project.nom_dossier}
                </div>
                <div>
                  <strong>Images en BDD:</strong> <Badge variant="secondary">{projectData.imageCount}</Badge>
                </div>
                <div>
                  <strong>Créé le:</strong> {new Date(projectData.project.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {projectData.recentImages.length > 0 && (
                <div>
                  <strong>Images récentes:</strong>
                  <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                    {projectData.recentImages.map((img: any) => (
                      <div key={img.id} className="text-sm p-2 bg-background rounded flex justify-between">
                        <span>{img.title}</span>
                        <span className="text-muted-foreground">{new Date(img.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Clés React Query récentes */}
        {cacheStats && cacheStats.reactQueryKeys.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Clés React Query (Galerie)</h3>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {cacheStats.reactQueryKeys.slice(0, 10).map((key, idx) => (
                <div key={idx} className="text-xs p-2 bg-muted rounded font-mono">
                  {key}
                </div>
              ))}
              {cacheStats.reactQueryKeys.length > 10 && (
                <div className="text-xs text-muted-foreground text-center p-2">
                  ... et {cacheStats.reactQueryKeys.length - 10} autres
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
