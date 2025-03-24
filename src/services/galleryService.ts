
import { supabase } from "@/integrations/supabase/client";
import { parseTagsString } from "@/utils/imageUtils";
import { toast } from "sonner";

const IMAGES_PER_PAGE = 50; // Fixed at 50 as requested

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
  
  // Pour admin_client et utilisateurs normaux, toujours filtrer par leur client ID
  if (['admin_client', 'user'].includes(userRole) && userClientId) {
    console.log('Non-admin user detected, forcing client filter:', userClientId);
    client = userClientId;
  }
  
  // Construction de la requête de base
  let query = supabase
    .from('images')
    .select('*');
  
  // Optimisation: Récupération des projets en une seule requête ou utilisation du cache
  let projetIds: string[] | null = null;
  if (client) {
    const cacheKey = `projectIds-${client}`;
    const cachedProjetIds = sessionStorage.getItem(cacheKey);
    
    if (cachedProjetIds) {
      // Utiliser les IDs de projets mis en cache
      projetIds = JSON.parse(cachedProjetIds);
      console.log('Using cached project IDs:', projetIds.length);
    } else {
      // Récupérer les IDs de projets et les mettre en cache
      const { data: projetData, error: projetError } = await supabase
        .from('projets')
        .select('id')
        .eq('id_client', client);
      
      if (projetError) {
        console.error('Error fetching projets for client:', projetError);
        toast.error("Erreur lors du chargement des projets");
        return [];
      }
      
      if (!projetData || projetData.length === 0) {
        console.log('No projects found for this client');
        // Mettre en cache un tableau vide pour éviter des requêtes répétées
        sessionStorage.setItem(cacheKey, JSON.stringify([]));
        return [];
      }
      
      projetIds = projetData.map(projet => projet.id);
      console.log('Project IDs for client:', projetIds.length);
      
      // Mettre en cache les IDs de projets
      sessionStorage.setItem(cacheKey, JSON.stringify(projetIds));
    }
    
    // Appliquer le filtre de projets
    if (projetIds.length > 0) {
      query = query.in('id_projet', projetIds);
    } else {
      // Aucun projet trouvé, retourner un tableau vide
      return [];
    }
  }
  
  // Appliquer le filtre de projet si fourni
  if (project) {
    query = query.eq('id_projet', project);
  }
  
  // Appliquer le filtre de recherche
  if (search && search.trim() !== '') {
    query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
  }

  // Appliquer le filtre de tag
  if (tag && tag.toLowerCase() !== 'toutes') {
    query = query.ilike('tags', `%${tag.toLowerCase()}%`);
  }
  
  // Appliquer le filtre d'onglet
  if (tab.toLowerCase() !== 'all') {
    query = query.ilike('tags', `%${tab.toLowerCase()}%`);
  }
  
  // Appliquer le tri et la pagination
  if (shouldFetchRandom && !project && !search && (!tag || tag.toLowerCase() === 'toutes') && tab.toLowerCase() === 'all') {
    // Pour un tri aléatoire lorsqu'aucun filtre n'est appliqué (sauf éventuellement client pour admin_client/user)
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
      if (projetIds && projetIds.length > 0) {
        countQuery.in('id_projet', projetIds);
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
      query = query
        .order('created_at', { ascending: false })
        .range(randomOffset, randomOffset + IMAGES_PER_PAGE - 1);
    } else {
      // Fallback si le comptage est 0 ou null
      query = query
        .order('created_at', { ascending: false })
        .limit(IMAGES_PER_PAGE);
    }
  } else {
    // Tri normal avec pagination lorsque des filtres sont appliqués
    query = query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);
  }
  
  // Exécuter la requête
  const { data, error } = await query;
  
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

export const GALLERY_CACHE_TIME = 15 * 60 * 1000; // 15 minutes pour réduire les appels API

// Générer une clé de cache unique basée sur les filtres
export function generateCacheKey(search: string, tag: string, tab: string, client: string | null, project: string | null, page: number, shouldFetchRandom: boolean = true, userRole: string = "", userClientId: string | null = null) {
  return ['gallery-images', search, tag, tab, client, project, page, shouldFetchRandom, userRole, userClientId];
}

/**
 * Calcule le nombre total d'images sans faire d'appel API si possible
 */
export async function fetchTotalImageCount(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null,
  project: string | null,
  userRole: string = "",
  userClientId: string | null = null
): Promise<number> {
  const cacheKey = `imageCount-${search}-${tag}-${tab}-${client}-${project}-${userRole}-${userClientId}`;
  const cachedCount = sessionStorage.getItem(cacheKey);
  
  if (cachedCount) {
    console.log('Using cached image count:', cachedCount);
    return parseInt(cachedCount, 10);
  }
  
  try {
    let query = supabase
      .from('images')
      .select('id', { count: 'exact', head: true });
    
    // Pour admin_client et utilisateurs normaux, toujours filtrer par leur client ID
    if (['admin_client', 'user'].includes(userRole) && userClientId) {
      client = userClientId;
    }
    
    if (client) {
      const projectCacheKey = `projectIds-${client}`;
      const cachedProjectIds = sessionStorage.getItem(projectCacheKey);
      
      if (cachedProjectIds) {
        const projetIds = JSON.parse(cachedProjectIds);
        if (projetIds.length > 0) {
          query = query.in('id_projet', projetIds);
        } else {
          return 0;
        }
      } else {
        const { data: projetData, error: projetError } = await supabase
          .from('projets')
          .select('id')
          .eq('id_client', client);
        
        if (projetError) {
          console.error('Error fetching projets for client:', projetError);
          return 0;
        }
        
        if (!projetData || projetData.length === 0) {
          sessionStorage.setItem(projectCacheKey, JSON.stringify([]));
          return 0;
        }
        
        const projetIds = projetData.map(projet => projet.id);
        sessionStorage.setItem(projectCacheKey, JSON.stringify(projetIds));
        
        query = query.in('id_projet', projetIds);
      }
    }
    
    if (project) {
      query = query.eq('id_projet', project);
    }
    
    if (search && search.trim() !== '') {
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    if (tag && tag.toLowerCase() !== 'toutes') {
      query = query.ilike('tags', `%${tag.toLowerCase()}%`);
    }
    
    if (tab.toLowerCase() !== 'all') {
      query = query.ilike('tags', `%${tab.toLowerCase()}%`);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error('Error fetching image count:', error);
      return 0;
    }
    
    if (count !== null) {
      sessionStorage.setItem(cacheKey, count.toString());
      console.log(`Cached image count: ${count}`);
      return count;
    }
    
    return 0;
  } catch (error) {
    console.error('Error counting images:', error);
    return 0;
  }
}
