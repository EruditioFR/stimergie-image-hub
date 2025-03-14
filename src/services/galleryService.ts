
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
  
  // If a client is selected, first get associated project IDs
  if (client) {
    // 1. Get all projects associated with this client
    const { data: projetData, error: projetError } = await supabase
      .from('projets')
      .select('id')
      .eq('id_client', client);
    
    if (projetError) {
      console.error('Error fetching projets for client:', projetError);
      toast.error("Erreur lors du chargement des projets");
      return [];
    }
    
    // If no projects for this client, return empty array
    if (!projetData || projetData.length === 0) {
      console.log('No projects found for this client');
      return [];
    }
    
    // 2. Extract project IDs
    const projetIds = projetData.map(projet => projet.id);
    console.log('Project IDs for client:', projetIds);
    
    // 3. Find images associated with these projects
    let query = supabase
      .from('images')
      .select('*')
      .in('id_projet', projetIds);
    
    if (search && search.trim() !== '') {
      // Add OR condition for title and tags for better search results
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    if (tag && tag.toLowerCase() !== 'toutes') {
      query = query.ilike('tags', `%${tag.toLowerCase()}%`);
    }
    
    if (tab.toLowerCase() !== 'all') {
      query = query.ilike('tags', `%${tab.toLowerCase()}%`);
    }
    
    // Apply ordering and pagination
    query = query.order('created_at', { ascending: false })
                 .range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching images by projects:', error);
      toast.error("Erreur lors du chargement des images");
      return [];
    }
    
    console.log(`Fetched ${data.length} images for client's projects for page ${pageNum}`);
    
    // Parse tags from string to array format
    return data.map(img => ({
      ...img,
      tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
    }));
  } else {
    // Standard case without client filter - simplifié pour éviter les problèmes de RLS
    let query = supabase
      .from('images')
      .select(`*`);
    
    if (search && search.trim() !== '') {
      // Add OR condition for title and tags for better search results
      query = query.or(`title.ilike.%${search}%,tags.ilike.%${search}%`);
    }

    if (tag && tag.toLowerCase() !== 'toutes') {
      query = query.ilike('tags', `%${tag.toLowerCase()}%`);
    }
    
    if (tab.toLowerCase() !== 'all') {
      query = query.ilike('tags', `%${tab.toLowerCase()}%`);
    }
    
    // Apply ordering
    query = query.order('created_at', { ascending: false });
    
    // Apply pagination
    query = query.range((pageNum - 1) * IMAGES_PER_PAGE, pageNum * IMAGES_PER_PAGE - 1);

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
}

export const GALLERY_CACHE_TIME = 5 * 60 * 1000; // 5 minutes in milliseconds
