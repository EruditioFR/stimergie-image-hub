
import { supabase } from "@/integrations/supabase/client";
import { parseTagsString } from "@/utils/imageUtils";
import { toast } from "sonner";
import { buildGalleryQuery, applyPaginationToQuery } from "./queryBuilder";

/**
 * Fetches gallery images with filtering options - optimisé pour réduire les appels API
 */
export async function fetchGalleryImages(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null,
  project: string | null,
  pageNum: number,
  shouldFetchRandom: boolean = true,
  userRole: string = "",
  userClientId: string | null = null
): Promise<any[]> {
  console.log('Fetching images with:', { search, tag, tab, client, project, pageNum, shouldFetchRandom, userRole, userClientId });
  
  // Construire la requête de base avec les filtres
  const { query, hasEmptyResult } = await buildGalleryQuery(
    search, tag, tab, client, project, userRole, userClientId
  );
  
  // Si la construction de requête indique qu'aucun résultat n'est attendu
  if (hasEmptyResult) {
    return [];
  }
  
  // Appliquer la pagination ou le tri aléatoire
  const paginatedQuery = await applyPaginationToQuery(
    query, pageNum, shouldFetchRandom, client, project, search, tag, tab
  );
  
  // Exécuter la requête
  const { data, error } = await paginatedQuery;
  
  if (error) {
    console.error('Error fetching images:', error);
    toast.error("Erreur lors du chargement des images");
    return [];
  }
  
  console.log(`Fetched ${data?.length || 0} images`);
  
  // Parser les tags du format string au format tableau
  return (data || []).map(img => ({
    ...img,
    tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
  }));
}
