
import { supabase } from "@/integrations/supabase/client";
import { parseTagsString } from "@/utils/imageUtils";
import { toast } from "sonner";

const IMAGES_PER_PAGE = 50; // Changed from 15 to 50
const ADMIN_INITIAL_IMAGES = 30; // Réduit de 100 à 30 pour limiter les requêtes
const MIN_PROJECTS = 5; // Réduit de 8 à 5 pour limiter les requêtes

/**
 * Fetches gallery images with filtering options
 */
export async function fetchGalleryImages(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null, 
  pageNum: number,
  isAdmin: boolean = false,
  isInitialLoad: boolean = false,
  userRole: string = "",
  userClientId: string | null = null
): Promise<any[]> {
  console.log('Fetching images with:', { search, tag, tab, client, pageNum, isAdmin, isInitialLoad, userRole });
  
  // For admin_client users, always filter by their client ID
  if (userRole === 'admin_client' && userClientId) {
    console.log('Admin client user detected, forcing client filter:', userClientId);
    client = userClientId;
  }
  
  // If this is initial load for admin user, show random images from at least MIN_PROJECTS projects
  if (isAdmin && isInitialLoad && !search && !tag && tab.toLowerCase() === 'all' && !client) {
    console.log('Loading random images from multiple projects for admin user');
    
    // First, get a list of at least MIN_PROJECTS different project IDs
    const { data: projectData, error: projectError } = await supabase
      .from('projets')
      .select('id')
      .limit(MIN_PROJECTS);
      
    if (projectError) {
      console.error('Error fetching projects:', projectError);
      toast.error("Erreur lors du chargement des projets");
      return [];
    }
    
    if (!projectData || projectData.length < MIN_PROJECTS) {
      console.log(`Not enough projects found (${projectData?.length || 0}), falling back to regular query`);
      
      // Fall back to regular random images query if we don't have enough projects
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(ADMIN_INITIAL_IMAGES);
        
      if (error) {
        console.error('Error fetching random images:', error);
        toast.error("Erreur lors du chargement des images");
        return [];
      }
      
      console.log(`Fetched ${data?.length || 0} random images for admin (fallback)`);
      
      return (data || []).map(img => ({
        ...img,
        tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
      }));
    }
    
    // Extract project IDs
    const projectIds = projectData.map(project => project.id);
    console.log('Using projects:', projectIds);
    
    // Query random images from these projects
    const { data, error } = await supabase
      .from('images')
      .select('*')
      .in('id_projet', projectIds)
      .order('created_at', { ascending: false })
      .limit(ADMIN_INITIAL_IMAGES);
      
    if (error) {
      console.error('Error fetching images from projects:', error);
      toast.error("Erreur lors du chargement des images");
      return [];
    }
    
    console.log(`Fetched ${data?.length || 0} random images from ${MIN_PROJECTS}+ projects for admin`);
    
    // Parse tags from string to array format
    return (data || []).map(img => ({
      ...img,
      tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
    }));
  }
  
  // Build base query for regular filtering
  let query = supabase
    .from('images')
    .select('*');
  
  // Apply client filter if provided - prioritizing this filter
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
  query = query
    .order('created_at', { ascending: false })
    .range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);
  
  // Execute query
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching images:', error);
    toast.error("Erreur lors du chargement des images");
    return [];
  }
  
  console.log(`Fetched ${data?.length || 0} images for page ${pageNum}`);
  
  // Parse tags from string to array format
  return (data || []).map(img => ({
    ...img,
    tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
  }));
}

export const GALLERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds

// Générer une clé de cache unique basée sur les filtres
export function generateCacheKey(search: string, tag: string, tab: string, client: string | null, page: number, isAdmin: boolean = false, isInitialLoad: boolean = false, userRole: string = "", userClientId: string | null = null) {
  return ['gallery-images', search, tag, tab, client, page, isAdmin, isInitialLoad, userRole, userClientId];
}
