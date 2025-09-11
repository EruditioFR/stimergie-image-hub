
import { supabase } from "@/integrations/supabase/client";
import { fetchProjectIdsForClient } from "./projectUtils";
import { getAccessibleProjects } from "./accessControl";
import { IMAGES_PER_PAGE } from "./constants";

/**
 * Build a base query for fetching gallery images with filters and access control
 */
export async function buildGalleryQuery(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null,
  project: string | null,
  userRole: string,
  userClientId: string | null,
  userId: string | null
) {
  console.log(`Building gallery query for user role: ${userRole}, client ID: ${userClientId}`);
  
  // Si on a un filtre de tag, on ignore les filtres client/projet SEULEMENT pour les admins
  const hasTagFilter = tag && tag.toLowerCase() !== 'toutes';
  
  // For non-admin users, ALWAYS filter by their client ID (même avec un filtre de tag)
  if (['admin_client', 'user'].includes(userRole) && userClientId) {
    console.log('Non-admin user detected, forcing client filter even with tag filter:', userClientId);
    client = userClientId;
  }
  
  // Si on recherche par nom de client et qu'on est admin, chercher les projets de ce client
  let clientProjectIds: string[] = [];
  if (search && search.trim() !== '' && userRole === 'admin') {
    console.log('Admin search detected, checking for client names:', search);
    
    // Chercher les clients qui correspondent à la recherche
    const { data: matchingClients } = await supabase
      .from('clients')
      .select('id')
      .ilike('nom', `%${search}%`);
    
    if (matchingClients && matchingClients.length > 0) {
      // Récupérer tous les projets de ces clients
      const clientIds = matchingClients.map(c => c.id);
      const { data: clientProjects } = await supabase
        .from('projets')
        .select('id')
        .in('id_client', clientIds);
      
      if (clientProjects) {
        clientProjectIds = clientProjects.map(p => p.id);
        console.log(`Found ${clientProjectIds.length} projects for matching clients`);
      }
    }
  }
  
  // Construction de la requête de base
  let query = supabase
    .from('images')
    .select(`
      *,
      projets:id_projet (nom_projet, nom_dossier, clients:id_client (id, nom)),
      image_shared_clients (client_id, clients:client_id (id, nom))
    `);
  
  // Obtenir et appliquer les IDs de projets si un client est sélectionné
  if (client) {
    const projetIds = await fetchProjectIdsForClient(client);
    
    if (projetIds && projetIds.length > 0) {
      // Filtrer les projets selon les droits d'accès pour les non-admins
      let accessibleProjectIds = projetIds;
      if (userRole !== 'admin' && userId) {
        const userAccessibleProjects = await getAccessibleProjects(userId);
        accessibleProjectIds = projetIds.filter(id => userAccessibleProjects.includes(id));
        
        if (accessibleProjectIds.length === 0) {
          console.log('User has no access to any projects for this client');
          return { query, hasEmptyResult: true };
        }
      }
      
      // Filter by project IDs (basic functionality restored)
      query = query.in('id_projet', accessibleProjectIds);
    } else {
      // No projects found, return empty result for now
      return { query, hasEmptyResult: true };
    }
  } else if (['admin_client', 'user'].includes(userRole) && !userClientId) {
    // If non-admin user with no client ID, don't show any images
    console.warn('Non-admin user with no client ID, returning empty result');
    return { query, hasEmptyResult: true };
  } else if (['admin_client', 'user'].includes(userRole) && userId) {
    // Pour les utilisateurs non-admin sans client spécifique, limiter aux projets accessibles
    const userAccessibleProjects = await getAccessibleProjects(userId);
    
    if (userAccessibleProjects.length === 0) {
      console.log('User has no accessible projects');
      return { query, hasEmptyResult: true };
    }
    
    query = query.in('id_projet', userAccessibleProjects);
  }
  
  // Appliquer le filtre de projet si fourni ET qu'on n'a pas de filtre de tag OU qu'on n'est pas admin
  if (project && (!hasTagFilter || ['admin_client', 'user'].includes(userRole))) {
    // Vérifier si l'utilisateur a accès à ce projet spécifique
    if (userRole !== 'admin' && userId) {
      const userAccessibleProjects = await getAccessibleProjects(userId);
      if (!userAccessibleProjects.includes(project)) {
        console.log(`User does not have access to project: ${project}`);
        return { query, hasEmptyResult: true };
      }
    }
    
    query = query.eq('id_projet', project);
  }
  
  // Appliquer le filtre de recherche - maintenant inclut le titre des images ET les projets des clients correspondants
  if (search && search.trim() !== '') {
    console.log('Applying search filter for:', search);
    
    if (clientProjectIds.length > 0 && userRole === 'admin') {
      // Pour les admins : chercher dans les titres/tags OU dans les projets des clients correspondants
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%,id_projet.in.(${clientProjectIds.join(',')})`);
    } else {
      // Recherche normale dans les titres et tags
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
    }
  }

  // Appliquer le filtre de tag
  if (hasTagFilter) {
    console.log('Tag filter detected, searching for tag:', tag);
    if (userRole === 'admin') {
      console.log('Admin user: searching across all clients and projects for tag');
    } else {
      console.log('Non-admin user: searching within accessible projects for tag');
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
