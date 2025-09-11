
// Gestionnaire de cache intelligent qui préserve l'authentification
import { generateCacheKey, manageCacheSize } from './cacheManager';

// Cache keys qui doivent être préservés (authentification, etc.)
const PROTECTED_CACHE_KEYS = [
  'sb-', // Supabase auth
  'auth-', // Auth tokens
  'session-', // Session data
  'user-', // User data
];

/**
 * Vérifie si une clé de cache doit être protégée (pas supprimée)
 */
export function isProtectedCacheKey(key: string): boolean {
  return PROTECTED_CACHE_KEYS.some(protectedKey => key.startsWith(protectedKey));
}

/**
 * Vide tous les caches d'images en préservant l'authentification
 */
export function clearImageCachesOnly(): void {
  console.log('🧹 Clearing image caches while preserving auth...');
  
  try {
    // Vider sessionStorage (sauf auth)
    const sessionKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('img_cache_') && !isProtectedCacheKey(key)) {
        sessionKeysToRemove.push(key);
      }
    }
    
    sessionKeysToRemove.forEach(key => {
      try {
        sessionStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove session key ${key}:`, e);
      }
    });
    
    console.log(`🗑️ Removed ${sessionKeysToRemove.length} session storage items`);
    
    // Vider localStorage (sauf auth)
    const localKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('global_img_cache_') && !isProtectedCacheKey(key)) {
        localKeysToRemove.push(key);
      }
    }
    
    localKeysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.warn(`Failed to remove local key ${key}:`, e);
      }
    });
    
    console.log(`🗑️ Removed ${localKeysToRemove.length} local storage items`);
    
    // Vider les caches mémoire
    try {
      const { fetchCache, processedUrlCache } = require('./cacheManager');
      const memoryKeysCleared = fetchCache.size + processedUrlCache.size;
      fetchCache.clear();
      processedUrlCache.clear();
      console.log(`🗑️ Cleared ${memoryKeysCleared} memory cache items`);
    } catch (e) {
      console.warn('Failed to clear memory caches:', e);
    }
    
    // Vider Cache API si disponible
    if ('caches' in window) {
      caches.delete('images-cache-v1').then(success => {
        console.log('🗑️ Browser Cache API cleared:', success);
      }).catch(e => {
        console.warn('Failed to clear Cache API:', e);
      });
    }
    
    // Forcer le rechargement de la page pour vider complètement tous les caches
    setTimeout(() => {
      window.location.reload();
    }, 500);
    
    console.log('✅ Image caches cleared successfully (auth preserved) - Page will reload');
    
  } catch (error) {
    console.error('❌ Error clearing image caches:', error);
  }
}

/**
 * Diagnostic complet des caches
 */
export function diagnoseCacheState(): {
  sessionStorage: number;
  localStorage: number;
  protectedKeys: string[];
  imageKeys: string[];
} {
  const protectedKeys: string[] = [];
  const imageKeys: string[] = [];
  let sessionStorageCount = 0;
  let localStorageCount = 0;
  
  try {
    // Analyser sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key) {
        if (isProtectedCacheKey(key)) {
          protectedKeys.push(key);
        } else if (key.startsWith('img_cache_')) {
          imageKeys.push(key);
          sessionStorageCount++;
        }
      }
    }
    
    // Analyser localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        if (isProtectedCacheKey(key)) {
          protectedKeys.push(key);
        } else if (key.startsWith('global_img_cache_')) {
          imageKeys.push(key);
          localStorageCount++;
        }
      }
    }
  } catch (e) {
    console.warn('Error diagnosing cache state:', e);
  }
  
  return {
    sessionStorage: sessionStorageCount,
    localStorage: localStorageCount,
    protectedKeys,
    imageKeys: imageKeys.slice(0, 10) // Limite pour éviter trop de logs
  };
}

/**
 * Vérification de cohérence des données
 */
export async function checkDataConsistency(projectId: string): Promise<{
  databaseCount: number;
  cacheEntries: number;
  inconsistencies: string[];
}> {
  const inconsistencies: string[] = [];
  
  try {
    // Vérifier en base de données
    const { supabase } = await import('@/integrations/supabase/client');
    const { count } = await supabase
      .from('images')
      .select('*', { count: 'exact', head: true })
      .eq('id_projet', projectId);
    
    const databaseCount = count || 0;
    
    // Vérifier dans les caches
    let cacheEntries = 0;
    const cacheKeys = [];
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.includes(projectId)) {
        cacheEntries++;
        cacheKeys.push(key);
      }
    }
    
    // Détecter les incohérences
    if (databaseCount > 0 && cacheEntries === 0) {
      inconsistencies.push('Images en BDD mais aucune dans le cache');
    }
    
    if (databaseCount === 0 && cacheEntries > 0) {
      inconsistencies.push('Images en cache mais aucune en BDD');
    }
    
    if (Math.abs(databaseCount - cacheEntries) > 5) {
      inconsistencies.push(`Écart important: ${databaseCount} en BDD vs ${cacheEntries} en cache`);
    }
    
    console.log(`📊 Consistency check for ${projectId}:`, {
      databaseCount,
      cacheEntries,
      inconsistencies
    });
    
    return {
      databaseCount,
      cacheEntries,
      inconsistencies
    };
    
  } catch (error) {
    console.error('Error checking data consistency:', error);
    return {
      databaseCount: 0,
      cacheEntries: 0,
      inconsistencies: ['Erreur lors de la vérification']
    };
  }
}
