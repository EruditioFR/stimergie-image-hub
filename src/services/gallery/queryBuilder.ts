
import { supabase } from "@/integrations/supabase/client";
import { fetchProjectIdsForClient } from "./projectUtils";
import { IMAGES_PER_PAGE } from "./constants";

/**
 * Build a base query for fetching gallery images with filters
 */
export async function buildGalleryQuery(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null,
  project: string | null,
  userRole: string,
  userClientId: string | null
) {
  console.log(`Building gallery query for user role: ${userRole}, client ID: ${userClientId}`);
  
  // Si on a un filtre de tag, on ignore les filtres client/projet SEULEMENT pour les admins
  const hasTagFilter = tag && tag.toLowerCase() !== 'toutes';
  
  // For non-admin users, ALWAYS filter by their client ID (même avec un filtre de tag)
  if (['admin_client', 'user'].includes(userRole) && userClientId) {
    console.log('Non-admin user detected, forcing client filter even with tag filter:', userClientId);
    client = userClientId;
  }
  
  // Construction de la requête de base
  let query = supabase
    .from('images')
    .select('*');
  
  // Obtenir et appliquer les IDs de projets si un client est sélectionné
  if (client) {
    const projetIds = await fetchProjectIdsForClient(client);
    
    if (projetIds && projetIds.length > 0) {
      query = query.in('id_projet', projetIds);
    } else {
      // Aucun projet trouvé, retourner une requête qui ne donnera aucun résultat
      return { query, hasEmptyResult: true };
    }
  } else if (['admin_client', 'user'].includes(userRole) && !userClientId) {
    // If non-admin user with no client ID, don't show any images
    console.warn('Non-admin user with no client ID, returning empty result');
    return { query, hasEmptyResult: true };
  }
  
  // Appliquer le filtre de projet si fourni ET qu'on n'a pas de filtre de tag OU qu'on n'est pas admin
  if (project && (!hasTagFilter || ['admin_client', 'user'].includes(userRole))) {
    query = query.eq('id_projet', project);
  }
  
  // Appliquer le filtre de recherche
  if (search && search.trim() !== '') {
    query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
  }

  // Appliquer le filtre de tag
  if (hasTagFilter) {
    console.log('Tag filter detected, searching for tag:', tag);
    if (userRole === 'admin') {
      console.log('Admin user: searching across all clients and projects for tag');
    } else {
      console.log('Non-admin user: searching within client scope for tag');
    }
    query = query.ilike('tags', `%${tag.toLowerCase()}%`);
  }
  
  // Appliquer le filtre d'onglet seulement si on n'a pas de filtre de tag
  if (tab.toLowerCase() !== 'all' && !hasTagFilter) {
    query = query.ilike('tags', `%${tab.toLowerCase()}%`);
  }
  
  return { query, hasEmptyResult: false };
}

/**
 * Apply pagination or random selection to a query
 */
export async function applyPaginationToQuery(
  query: any,
  pageNum: number,
  shouldFetchRandom: boolean,
  client: string | null,
  project: string | null,
  search: string,
  tag: string,
  tab: string
) {
  // Déterminer si le mode aléatoire doit être utilisé
  const useRandomMode = shouldFetchRandom && 
                         !project && 
                         !search && 
                         (!tag || tag.toLowerCase() === 'toutes') && 
                         tab.toLowerCase() === 'all';
  
  if (useRandomMode) {
    // Pour un tri aléatoire lorsqu'aucun filtre n'est appliqué (sauf éventuellement client)
    console.log('Applying random ordering to images');
    
    // Optimisation: Utiliser le cache pour le comptage total
    const countCacheKey = `imageCount-${client || 'all'}`;
    let count: number | null = null;
    const cachedCount = sessionStorage.getItem(countCacheKey);
    
    if (cachedCount) {
      count = parseInt(cachedCount, 10);
      console.log(`Using cached image count: ${count}`);
    } else {
      // Obtenir le nombre total pour déterminer le décalage aléatoire
      const countQuery = supabase.from('images').select('*', { count: 'exact', head: true });
      
      // Appliquer les mêmes filtres à la requête de comptage
      if (client) {
        const projetIds = await fetchProjectIdsForClient(client);
        if (projetIds && projetIds.length > 0) {
          countQuery.in('id_projet', projetIds);
        }
      }
      
      const { count: fetchedCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error('Error getting count:', countError);
      } else if (fetchedCount !== null) {
        count = fetchedCount;
        // Mettre en cache pour de futures requêtes
        sessionStorage.setItem(countCacheKey, count.toString());
      }
      
      console.log(`Total image count: ${count}`);
    }
    
    // S'il y a des images, sélectionner un sous-ensemble aléatoire
    if (count && count > 0) {
      // Calculer le décalage maximal possible pour garantir que nous obtenons suffisamment d'images
      const maxOffset = Math.max(0, count - IMAGES_PER_PAGE);
      const randomOffset = maxOffset > 0 ? Math.floor(Math.random() * maxOffset) : 0;
      console.log(`Using random offset: ${randomOffset}`);
      
      // Appliquer le tri et la pagination
      return query
        .order('created_at', { ascending: false })
        .range(randomOffset, randomOffset + IMAGES_PER_PAGE - 1);
    } else {
      // Fallback si le comptage est 0 ou null
      return query
        .order('created_at', { ascending: false })
        .limit(IMAGES_PER_PAGE);
    }
  } else {
    // Tri normal avec pagination lorsque des filtres sont appliqués
    return query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);
  }
}
