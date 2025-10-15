
import { supabase } from "@/integrations/supabase/client";
import { fetchProjectIdsForClient, getAccessibleProjectIds } from "./projectUtils";
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
  userId: string | null,
  userClientIds: string[] = []
) {
  console.log(`Building gallery query for user role: ${userRole}, client ID: ${userClientId}, client IDs: ${userClientIds.join(', ')}`);
  
  // Si on a un filtre de tag, on ignore les filtres client/projet SEULEMENT pour les admins
  const hasTagFilter = tag && tag.toLowerCase() !== 'toutes';
  
  // Pour les utilisateurs avec un SEUL client, forcer le filtre
  // Pour les utilisateurs avec PLUSIEURS clients, ne forcer que si un seul client est assigné
  if (['admin_client', 'user'].includes(userRole)) {
    if (userClientIds.length === 1 && !client) {
      // Utilisateur avec un seul client : le forcer
      console.log('Single-client user detected, forcing client filter:', userClientIds[0]);
      client = userClientIds[0];
    } else if (userClientIds.length > 1 && !client) {
      // Utilisateur avec plusieurs clients et aucun client sélectionné : ne rien forcer
      // Les projets accessibles seront filtrés par getAccessibleProjectIds
      console.log('Multi-client user with no selection: will use accessible projects filter');
    } else if (client && userClientIds.length > 0 && !userClientIds.includes(client)) {
      // Vérification de sécurité : l'utilisateur ne peut pas sélectionner un client auquel il n'a pas accès
      console.log('User attempted to access unauthorized client:', client);
      return { query: supabase.from('images').select('*'), hasEmptyResult: true };
    }
  }
  
  // Si on recherche par nom de client ou nom de dossier et qu'on est admin, chercher les projets correspondants
  let clientProjectIds: string[] = [];
  if (search && search.trim() !== '' && userRole === 'admin') {
    console.log('Admin search detected, checking for client names and project folders:', search);
    
    // 1. Chercher les clients qui correspondent à la recherche
    const { data: matchingClients } = await supabase
      .from('clients')
      .select('id')
      .ilike('nom', `%${search}%`);
    
    // 2. Chercher les projets dont le nom_dossier correspond à la recherche
    const { data: matchingProjects } = await supabase
      .from('projets')
      .select('id')
      .ilike('nom_dossier', `%${search}%`);
    
    // 3. Fusionner les résultats
    const projectIdsFromClients: string[] = [];
    if (matchingClients && matchingClients.length > 0) {
      const clientIds = matchingClients.map(c => c.id);
      const { data: clientProjects } = await supabase
        .from('projets')
        .select('id')
        .in('id_client', clientIds);
      
      if (clientProjects) {
        projectIdsFromClients.push(...clientProjects.map(p => p.id));
      }
    }
    
    const projectIdsFromFolders = matchingProjects?.map(p => p.id) || [];
    
    // Fusionner et dédupliquer les IDs de projets
    clientProjectIds = [...new Set([...projectIdsFromClients, ...projectIdsFromFolders])];
    
    console.log(`Found ${clientProjectIds.length} projects matching search criteria (clients + folders)`);
  }
  
  // Construction de la requête de base avec colonnes minimales pour meilleures performances
  let query = supabase
    .from('images')
    .select(`
      id,
      title,
      url,
      url_miniature,
      orientation,
      tags,
      created_at,
      id_projet,
      width,
      height,
      projets:id_projet (nom_projet, nom_dossier, id_client, clients:id_client(id, nom))
    `);
  
  // Apply project filtering based on user role and access rights
  if (client) {
    if (userRole === 'admin') {
      // Admins can use the full client project list
      const projetIds = await fetchProjectIdsForClient(client);
      
      if (projetIds && projetIds.length > 0) {
        query = query.in('id_projet', projetIds);
      } else {
        return { query, hasEmptyResult: true };
      }
    } else if (userId) {
      // Non-admin users: get accessible projects directly (respects RLS and access periods)
      const userAccessibleProjects = await getAccessibleProjectIds(userId, true);
      
      if (userAccessibleProjects.length === 0) {
        console.log('User has no accessible projects');
        return { query, hasEmptyResult: true };
      }
      
      // For non-admin users with a client filter, intersect accessible projects with the client's projects
      const clientProjects = await fetchProjectIdsForClient(client);
      const allowedIds = clientProjects && clientProjects.length > 0
        ? userAccessibleProjects.filter((id: string) => clientProjects.includes(id))
        : userAccessibleProjects;

      if (allowedIds.length === 0) {
        console.log('No allowed projects after intersecting client projects and user access');
        return { query, hasEmptyResult: true };
      }

      query = query.in('id_projet', allowedIds);
    }
  } else if (['admin_client', 'user'].includes(userRole) && userClientIds.length === 0) {
    // If non-admin user with no client IDs, this means the client IDs are still loading
    console.log('Non-admin user with no client IDs yet (still loading), waiting...');
    return { query, hasEmptyResult: true };
  } else if (['admin_client', 'user'].includes(userRole) && userId) {
    // Non-admin users without specific client: show all accessible projects
    const userAccessibleProjects = await getAccessibleProjectIds(userId, true);
    
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
      const userAccessibleProjects = await getAccessibleProjectIds(userId);
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
 * IMPORTANT: This function now executes the query and returns { data, error }
 */
export async function applyPaginationToQuery(
  query: any,
  pageNum: number,
  shouldFetchRandom: boolean,
  client: string | null,
  project: string | null,
  search: string,
  tag: string,
  tab: string,
  userRole: string,
  userId: string | null,
  userClientId: string | null
): Promise<{ data: any[] | null; error: any }> {
  // Déterminer si le mode aléatoire doit être utilisé
  // Force standard pagination for admins unless explicitly in random mode
  const useRandomMode = shouldFetchRandom && 
                         userRole !== 'admin' && // Admins always use standard pagination by default
                         !project && 
                         !search && 
                         (!tag || tag.toLowerCase() === 'toutes') && 
                         tab.toLowerCase() === 'all';
  
  if (useRandomMode) {
    // OPTIMIZED: Fetch more images and shuffle client-side (faster than count + offset)
    // This avoids the expensive COUNT(*) query entirely
    console.log('🎲 Applying optimized random ordering (client-side shuffle)');
    
    // Fetch 2x the needed images to have variety, then shuffle
    const fetchLimit = IMAGES_PER_PAGE * 2;
    
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(fetchLimit);
    
    if (error) {
      console.error('Error fetching images for random mode:', error);
      return { data: null, error };
    }
    
    // Shuffle the results using Fisher-Yates algorithm
    const shuffled = [...(data || [])];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return only the first IMAGES_PER_PAGE items
    return { data: shuffled.slice(0, IMAGES_PER_PAGE), error: null };
  } else {
    // Standard pagination with cursor for filtered queries
    console.log(`📄 Standard pagination: page ${pageNum}`);
    return await query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);
  }
}
