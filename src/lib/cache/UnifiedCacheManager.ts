/**
 * Unified Cache Manager - Phase 1: Consolidation
 * Centralizes all caching operations under React Query with optimized storage adapters
 */

import { QueryClient } from '@tanstack/react-query';

// Cache configuration constants
export const CACHE_CONFIG = {
  // TTL (Time To Live) for different data types
  TTL: {
    GALLERY_IMAGES: 1000 * 60 * 30, // 30 minutes
    USER_DATA: 1000 * 60 * 60 * 2, // 2 hours  
    PROJECT_DATA: 1000 * 60 * 15, // 15 minutes
    METADATA: 1000 * 60 * 60, // 1 hour
    TEMPORARY: 1000 * 60 * 5, // 5 minutes
  },
  // Cache size limits
  LIMITS: {
    MAX_QUERIES: 100,
    MAX_SESSION_SIZE: 50 * 1024 * 1024, // 50MB
    MAX_LOCAL_SIZE: 100 * 1024 * 1024, // 100MB
  },
  // Protected cache keys (auth data)
  PROTECTED_KEYS: [
    'sb-', 'auth-', 'session-', 'user-profile', 'supabase.auth.token'
  ]
};

/**
 * Smart Storage Adapter - Hierarchical cache strategy
 * React Query → sessionStorage → localStorage → API
 */
class SmartStorageAdapter {
  private sessionCache = new Map<string, any>();
  private memoryCache = new Map<string, any>();

  getItem(key: string): string | null {
    try {
      // 1. Check memory cache first (fastest)
      if (this.memoryCache.has(key)) {
        return this.memoryCache.get(key);
      }

      // 2. Check sessionStorage (fast, session-scoped)  
      const sessionValue = sessionStorage.getItem(key);
      if (sessionValue) {
        this.memoryCache.set(key, sessionValue);
        return sessionValue;
      }

      // 3. Check localStorage (slower, persistent)
      const localValue = localStorage.getItem(key);
      if (localValue) {
        // Promote to session cache
        this.setSessionItem(key, localValue);
        return localValue;
      }

      return null;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      // Always set in memory cache
      this.memoryCache.set(key, value);

      // Determine storage strategy based on key type
      if (this.isTemporaryData(key)) {
        this.setSessionItem(key, value);
      } else if (this.isImportantData(key)) {
        this.setLocalItem(key, value);
        this.setSessionItem(key, value);
      } else {
        this.setSessionItem(key, value);
      }
    } catch (error) {
      console.warn('Cache write error:', error);
    }
  }

  removeItem(key: string): void {
    try {
      this.memoryCache.delete(key);
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  }

  clear(): void {
    try {
      // Only clear cache-related items, preserve auth
      this.clearCacheItems(sessionStorage);
      this.clearCacheItems(localStorage);
      this.memoryCache.clear();
    } catch (error) {
      console.warn('Cache clear error:', error);
    }
  }

  private setSessionItem(key: string, value: string): void {
    try {
      sessionStorage.setItem(key, value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupSessionStorage();
        try {
          sessionStorage.setItem(key, value);
        } catch {
          console.warn('Session storage full, using memory only');
        }
      }
    }
  }

  private setLocalItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.cleanupLocalStorage();
        try {
          localStorage.setItem(key, value);
        } catch {
          console.warn('Local storage full, fallback to session');
          this.setSessionItem(key, value);
        }
      }
    }
  }

  private isTemporaryData(key: string): boolean {
    return key.includes('gallery-images') || key.includes('temp-');
  }

  private isImportantData(key: string): boolean {
    return key.includes('user-') || key.includes('projects') || key.includes('clients');
  }

  private isProtectedKey(key: string): boolean {
    return CACHE_CONFIG.PROTECTED_KEYS.some(prefix => key.startsWith(prefix));
  }

  private cleanupSessionStorage(): void {
    const itemsToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && !this.isProtectedKey(key)) {
        itemsToRemove.push(key);
      }
    }
    // Remove oldest 30%
    const removeCount = Math.ceil(itemsToRemove.length * 0.3);
    for (let i = 0; i < removeCount; i++) {
      sessionStorage.removeItem(itemsToRemove[i]);
    }
  }

  private cleanupLocalStorage(): void {
    const itemsToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !this.isProtectedKey(key) && !key.includes('user-')) {
        itemsToRemove.push(key);
      }
    }
    // Remove oldest 25%
    const removeCount = Math.ceil(itemsToRemove.length * 0.25);
    for (let i = 0; i < removeCount; i++) {
      localStorage.removeItem(itemsToRemove[i]);
    }
  }

  private clearCacheItems(storage: Storage): void {
    const itemsToRemove = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key && !this.isProtectedKey(key)) {
        itemsToRemove.push(key);
      }
    }
    itemsToRemove.forEach(key => storage.removeItem(key));
  }
}

/**
 * Unified Cache Manager - Main orchestrator
 */
export class UnifiedCacheManager {
  private queryClient: QueryClient;
  private storageAdapter: SmartStorageAdapter;
  private isInitialized = false;

  constructor() {
    this.storageAdapter = new SmartStorageAdapter();
    this.setupQueryClient();
    this.isInitialized = true;
    console.log('✅ Unified cache system initialized');
  }

  private setupQueryClient(): void {
    this.queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          // Optimized default settings
          staleTime: CACHE_CONFIG.TTL.GALLERY_IMAGES,
          gcTime: CACHE_CONFIG.TTL.GALLERY_IMAGES * 2,
          retry: 2,
          retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
          refetchOnWindowFocus: false,
          refetchOnReconnect: true,
        },
        mutations: {
          retry: 1,
          retryDelay: 1000,
        }
      }
    });

    // Global error handling
    this.queryClient.setMutationDefaults(['gallery'], {
      onError: (error) => {
        console.error('Cache mutation error:', error);
      }
    });
  }

  getQueryClient(): QueryClient {
    return this.queryClient;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  // Cache health monitoring
  getDiagnostics(): {
    totalQueries: number;
    galleryQueries: number;
    memoryUsage: number;
    storageUsage: { session: number; local: number };
  } {
    const cache = this.queryClient.getQueryCache();
    const queries = cache.getAll();
    
    const galleryQueries = queries.filter(q => {
      const key = JSON.stringify(q.queryKey);
      return key.includes('gallery') || key.includes('images');
    });

    // Estimate storage usage
    let sessionUsage = 0;
    let localUsage = 0;
    
    try {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          const value = sessionStorage.getItem(key);
          sessionUsage += (key.length + (value?.length || 0)) * 2; // UTF-16
        }
      }

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          localUsage += (key.length + (value?.length || 0)) * 2;
        }
      }
    } catch (error) {
      console.warn('Storage usage calculation failed:', error);
    }

    return {
      totalQueries: queries.length,
      galleryQueries: galleryQueries.length,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
      storageUsage: { session: sessionUsage, local: localUsage }
    };
  }

  // Emergency cache clear (preserves auth)
  emergencyClear(): void {
    console.log('🚨 Emergency cache clear initiated');
    try {
      // Clear React Query cache (except auth-related)
      this.queryClient.getQueryCache().clear();
      
      // Clear storage caches
      this.storageAdapter.clear();
      
      // Force garbage collection if available
      if (window.gc) {
        window.gc();
      }
      
      console.log('✅ Emergency cache clear completed');
    } catch (error) {
      console.error('❌ Emergency cache clear failed:', error);
    }
  }
}

// Singleton instance
export const unifiedCacheManager = new UnifiedCacheManager();