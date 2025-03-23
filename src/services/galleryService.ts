
import { supabase } from "@/integrations/supabase/client";
import { parseTagsString } from "@/utils/imageUtils";
import { toast } from "sonner";

const IMAGES_PER_PAGE = 50; // Fixed at 50 as requested

/**
 * Fetches gallery images with filtering options
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
  
  // For admin_client and regular users, always filter by their client ID
  if (['admin_client', 'user'].includes(userRole) && userClientId) {
    console.log('Non-admin user detected, forcing client filter:', userClientId);
    client = userClientId;
  }
  
  // Build base query for regular filtering
  let query = supabase
    .from('images')
    .select('*');
  
  // Apply client filter if provided
  if (client) {
    // Get all projects for this client first
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
      return [];
    }
    
    // Extract project IDs
    const projetIds = projetData.map(projet => projet.id);
    console.log('Project IDs for client:', projetIds);
    
    // Filter images by project IDs
    query = query.in('id_projet', projetIds);
  }
  
  // Apply project filter if provided
  if (project) {
    query = query.eq('id_projet', project);
  }
  
  // Apply search filter
  if (search && search.trim() !== '') {
    query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
  }

  // Apply tag filter
  if (tag && tag.toLowerCase() !== 'toutes') {
    query = query.ilike('tags', `%${tag.toLowerCase()}%`);
  }
  
  // Apply tab filter
  if (tab.toLowerCase() !== 'all') {
    query = query.ilike('tags', `%${tab.toLowerCase()}%`);
  }
  
  // Apply ordering and pagination
  if (shouldFetchRandom && !project && !search && (!tag || tag.toLowerCase() === 'toutes') && tab.toLowerCase() === 'all') {
    // For truly random ordering when no filters are applied (except possibly client for admin_client/user)
    console.log('Applying random ordering to images');
    
    // First get total count to determine random offset
    const countQuery = supabase.from('images').select('*', { count: 'exact', head: true });
    
    // Apply the same filters to the count query
    if (client) {
      const { data: projetData } = await supabase
        .from('projets')
        .select('id')
        .eq('id_client', client);
      
      if (projetData && projetData.length > 0) {
        const projetIds = projetData.map(projet => projet.id);
        countQuery.in('id_projet', projetIds);
      }
    }
    
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('Error getting count:', countError);
    }
    
    console.log(`Total image count: ${count}`);
    
    // If there are images, select a random subset
    if (count && count > 0) {
      // Calculate maximum possible offset to ensure we get enough images
      const maxOffset = Math.max(0, count - IMAGES_PER_PAGE);
      const randomOffset = maxOffset > 0 ? Math.floor(Math.random() * maxOffset) : 0;
      console.log(`Using random offset: ${randomOffset}`);
      
      // Apply the ordering and pagination
      query = query
        .order('created_at', { ascending: false })
        .range(randomOffset, randomOffset + IMAGES_PER_PAGE - 1);
    } else {
      // Fallback if count is 0 or null
      query = query
        .order('created_at', { ascending: false })
        .limit(IMAGES_PER_PAGE);
    }
  } else {
    // Regular sorting with pagination when filters are applied
    query = query
      .order('created_at', { ascending: false })
      .range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);
  }
  
  // Execute query
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching images:', error);
    toast.error("Erreur lors du chargement des images");
    return [];
  }
  
  console.log(`Fetched ${data?.length || 0} images`);
  
  // Parse tags from string to array format
  return (data || []).map(img => ({
    ...img,
    tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
  }));
}

export const GALLERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes

// Générer une clé de cache unique basée sur les filtres
export function generateCacheKey(search: string, tag: string, tab: string, client: string | null, project: string | null, page: number, shouldFetchRandom: boolean = true, userRole: string = "", userClientId: string | null = null) {
  return ['gallery-images', search, tag, tab, client, project, page, shouldFetchRandom, userRole, userClientId];
}
