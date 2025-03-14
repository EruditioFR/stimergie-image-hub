
import { supabase } from "@/integrations/supabase/client";
import { parseTagsString } from "@/utils/imageUtils";
import { toast } from "sonner";

const IMAGES_PER_PAGE = 15;

/**
 * Fetches gallery images with filtering options
 */
export async function fetchGalleryImages(
  search: string, 
  tag: string, 
  tab: string, 
  client: string | null, 
  pageNum: number
): Promise<any[]> {
  console.log('Fetching images with:', { search, tag, tab, client, pageNum });
  
  // Build base query
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
  
  console.log(`Fetched ${data.length} images for page ${pageNum}`);
  
  // Parse tags from string to array format
  return data.map(img => ({
    ...img,
    tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
  }));
}

export const GALLERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
