/**
 * Cache Invalidation Service - Phase 3: Intelligent Invalidation
 * Centralized, event-driven cache invalidation system
 */

import { QueryClient } from '@tanstack/react-query';
import { unifiedCacheManager } from './UnifiedCacheManager';

// Invalidation event types
type InvalidationEvent = {
  type: 'project_change' | 'user_change' | 'image_change' | 'client_change' | 'force_refresh';
  data: {
    projectId?: string;
    clientId?: string;
    userId?: string;
    imageId?: string;
    scope?: 'all' | 'current_user' | 'specific';
  };
};

// Invalidation strategies
type InvalidationStrategy = {
  queries: string[];
  storageKeys?: string[];
  forceRefresh?: boolean;
  backgroundRefresh?: boolean;
};

/**
 * Centralized Cache Invalidation Service
 */
export class CacheInvalidationService {
  private queryClient: QueryClient;
  private invalidationQueue: Map<string, InvalidationEvent> = new Map();
  private isProcessing = false;
  private backgroundRefreshEnabled = true;

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
    this.setupEventListeners();
  }

  /**
   * Main invalidation method - handles all invalidation scenarios
   */
  async invalidate(event: InvalidationEvent): Promise<void> {
    console.log('🔄 Cache invalidation:', event.type, event.data);

    // Queue the event to avoid race conditions
    const eventKey = `${event.type}_${JSON.stringify(event.data)}`;
    this.invalidationQueue.set(eventKey, event);

    if (!this.isProcessing) {
      await this.processInvalidationQueue();
    }
  }

  /**
   * Process queued invalidation events
   */
  private async processInvalidationQueue(): Promise<void> {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    
    try {
      const events = Array.from(this.invalidationQueue.values());
      this.invalidationQueue.clear();

      // Group events by type for batch processing
      const eventGroups = this.groupEventsByType(events);

      // Process each group with appropriate strategy
      for (const [type, eventList] of eventGroups) {
        await this.processEventGroup(type, eventList);
      }

      console.log('✅ Cache invalidation completed');
    } catch (error) {
      console.error('❌ Cache invalidation error:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Group events by type for efficient batch processing
   */
  private groupEventsByType(events: InvalidationEvent[]): Map<string, InvalidationEvent[]> {
    const groups = new Map<string, InvalidationEvent[]>();
    
    events.forEach(event => {
      const existing = groups.get(event.type) || [];
      existing.push(event);
      groups.set(event.type, existing);
    });

    return groups;
  }

  /**
   * Process a group of events with specific strategy
   */
  private async processEventGroup(type: string, events: InvalidationEvent[]): Promise<void> {
    const strategy = this.getInvalidationStrategy(type, events);
    
    // 1. Invalidate React Query queries
    await this.invalidateQueries(strategy.queries, events);
    
    // 2. Clear storage if needed
    if (strategy.storageKeys) {
      this.clearStorageKeys(strategy.storageKeys);
    }
    
    // 3. Background refresh if enabled
    if (strategy.backgroundRefresh && this.backgroundRefreshEnabled) {
      this.scheduleBackgroundRefresh(events);
    }
    
    // 4. Force refresh if required
    if (strategy.forceRefresh) {
      this.forceRefresh(events);
    }
  }

  /**
   * Get invalidation strategy based on event type
   */
  private getInvalidationStrategy(type: string, events: InvalidationEvent[]): InvalidationStrategy {
    switch (type) {
      case 'project_change':
        return {
          queries: ['gallery-images', 'projects', 'project-access'],
          storageKeys: ['gallery-cache', 'project-cache'],
          backgroundRefresh: true
        };
      
      case 'image_change':
        return {
          queries: ['gallery-images', 'image-details'],
          storageKeys: ['img_cache_'],
          backgroundRefresh: true
        };
      
      case 'user_change':
        return {
          queries: ['users', 'profiles', 'permissions'],
          forceRefresh: true
        };
      
      case 'client_change':
        return {
          queries: ['clients', 'projects', 'gallery-images'],
          storageKeys: ['client-cache'],
          backgroundRefresh: true
        };
      
      case 'force_refresh':
        return {
          queries: ['gallery-images', 'projects', 'clients'],
          storageKeys: ['img_cache_', 'gallery-cache'],
          forceRefresh: true
        };
      
      default:
        return {
          queries: ['gallery-images'],
          backgroundRefresh: true
        };
    }
  }

  /**
   * Invalidate React Query queries with smart predicates
   */
  private async invalidateQueries(queryTypes: string[], events: InvalidationEvent[]): Promise<void> {
    const predicates = queryTypes.map(queryType => {
      return (query: any) => {
        const key = JSON.stringify(query.queryKey);
        
        // Check if query matches the type
        if (!key.includes(queryType)) return false;
        
        // Additional filtering based on event data
        for (const event of events) {
          if (event.data.projectId && key.includes(event.data.projectId)) return true;
          if (event.data.clientId && key.includes(event.data.clientId)) return true;
          if (event.data.userId && key.includes(event.data.userId)) return true;
          if (event.data.scope === 'all') return true;
        }
        
        // Default: invalidate if no specific filters
        return events.some(e => !e.data.projectId && !e.data.clientId && !e.data.userId);
      };
    });

    // Execute invalidations
    for (const predicate of predicates) {
      await this.queryClient.invalidateQueries({ predicate });
    }
  }

  /**
   * Clear specific storage keys
   */
  private clearStorageKeys(keyPrefixes: string[]): void {
    try {
      keyPrefixes.forEach(prefix => {
        // Session Storage
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const key = sessionStorage.key(i);
          if (key && key.includes(prefix)) {
            sessionStorage.removeItem(key);
          }
        }
        
        // Local Storage  
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const key = localStorage.key(i);
          if (key && key.includes(prefix)) {
            localStorage.removeItem(key);
          }
        }
      });
    } catch (error) {
      console.warn('Storage clear error:', error);
    }
  }

  /**
   * Schedule background refresh for critical queries
   */
  private scheduleBackgroundRefresh(events: InvalidationEvent[]): void {
    // Delay background refresh to avoid overwhelming the system
    setTimeout(async () => {
      try {
        for (const event of events) {
          if (event.data.projectId) {
            await this.prefetchProjectData(event.data.projectId);
          }
        }
      } catch (error) {
        console.warn('Background refresh error:', error);
      }
    }, 2000);
  }

  /**
   * Force immediate refresh of critical data
   */
  private forceRefresh(events: InvalidationEvent[]): void {
    // Force page refresh only if absolutely necessary
    const needsPageRefresh = events.some(e => 
      e.type === 'user_change' || 
      (e.type === 'force_refresh' && e.data.scope === 'all')
    );
    
    if (needsPageRefresh) {
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  /**
   * Prefetch critical project data in background
   */
  private async prefetchProjectData(projectId: string): Promise<void> {
    try {
      const { fetchGalleryImages } = await import('@/services/gallery/imageService');
      
      // Prefetch first page of project images
      await this.queryClient.prefetchQuery({
        queryKey: ['gallery-images', '', '', 'all', null, projectId, 1, false, 'user', null],
        queryFn: () => fetchGalleryImages('', '', 'all', null, projectId, 1, false, 'user', null, null),
        staleTime: 5 * 60 * 1000 // 5 minutes
      });
      
      console.log(`📥 Background refresh completed for project ${projectId}`);
    } catch (error) {
      console.warn(`Background refresh failed for project ${projectId}:`, error);
    }
  }

  /**
   * Setup event listeners for automatic invalidation
   */
  private setupEventListeners(): void {
    // Listen to custom events
    window.addEventListener('projectAdded', (e: any) => {
      this.invalidate({
        type: 'project_change',
        data: { projectId: e.detail?.projectId, scope: 'all' }
      });
    });

    window.addEventListener('projectUpdated', (e: any) => {
      this.invalidate({
        type: 'project_change',
        data: { projectId: e.detail?.projectId }
      });
    });

    window.addEventListener('projectDeleted', (e: any) => {
      this.invalidate({
        type: 'project_change',
        data: { projectId: e.detail?.projectId, scope: 'all' }
      });
    });

    // Listen to browser events
    window.addEventListener('focus', () => {
      // Soft refresh when user returns to tab
      if (document.hidden === false) {
        this.invalidate({
          type: 'force_refresh',
          data: { scope: 'current_user' }
        });
      }
    });
  }

  /**
   * Manual invalidation methods for common scenarios
   */
  async invalidateGallery(projectId?: string, clientId?: string): Promise<void> {
    await this.invalidate({
      type: 'image_change',
      data: { projectId, clientId }
    });
  }

  async invalidateProjects(clientId?: string): Promise<void> {
    await this.invalidate({
      type: 'project_change',
      data: { clientId }
    });
  }

  async forceFullRefresh(): Promise<void> {
    await this.invalidate({
      type: 'force_refresh',
      data: { scope: 'all' }
    });
  }

  /**
   * Enable/disable background refresh
   */
  setBackgroundRefresh(enabled: boolean): void {
    this.backgroundRefreshEnabled = enabled;
    console.log(`Background refresh ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Singleton service
let cacheInvalidationService: CacheInvalidationService;

export const getCacheInvalidationService = (): CacheInvalidationService => {
  if (!cacheInvalidationService) {
    const queryClient = unifiedCacheManager.getQueryClient();
    cacheInvalidationService = new CacheInvalidationService(queryClient);
  }
  return cacheInvalidationService;
};