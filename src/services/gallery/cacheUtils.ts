
/**
 * Utility functions for gallery caching
 */

// Générer une clé de cache unique basée sur les filtres
export function generateCacheKey(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null, 
  project: string | null, 
  page: number, 
  shouldFetchRandom: boolean = true, 
  userRole: string = "", 
  userClientId: string | null = null
) {
  return ['gallery-images', search, tag, tab, client, project, page, shouldFetchRandom, userRole, userClientId];
}
