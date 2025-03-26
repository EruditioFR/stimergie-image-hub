
/**
 * Utility functions for gallery caching
 */

// Générer une clé de cache unique basée sur les filtres - sans cache
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
  // Maintenant retourne simplement un tableau d'identifiants pour react-query
  return ['gallery-images', search, tag, tab, client, project, page, shouldFetchRandom, userRole, userClientId];
}
