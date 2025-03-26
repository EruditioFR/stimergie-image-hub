
import { supabase } from "@/integrations/supabase/client";
import { parseTagsString } from "@/utils/imageUtils";
import { toast } from "sonner";
import { buildGalleryQuery, applyPaginationToQuery } from "./queryBuilder";
import { generateDisplayImageUrl, generateDownloadImageUrl } from "@/utils/image/imageUrlGenerator";
import { validateImageUrl } from "@/utils/image/urlUtils";

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
  
  // Joindre la table des projets pour obtenir le nom du dossier
  let joinedQuery = query.select(`
    id, width, height, created_at, id_projet, title, description, url, orientation, tags, url_miniature, created_by, updated_at,
    projets!id_projet (nom_projet, nom_dossier)
  `);
  
  // Appliquer la pagination ou le tri aléatoire
  const paginatedQuery = await applyPaginationToQuery(
    joinedQuery, pageNum, shouldFetchRandom, client, project, search, tag, tab
  );
  
  // Exécuter la requête
  const { data, error } = await paginatedQuery;
  
  if (error) {
    console.error('Error fetching images:', error);
    toast.error("Erreur lors du chargement des images");
    return [];
  }
  
  console.log(`Fetched ${data?.length || 0} images`);
  
  // Transformer les données pour générer les URLs d'images correctes
  const transformedData = (data || []).map(img => {
    const folderName = img.projets?.nom_dossier || "";
    const imageTitle = img.title || `image-${img.id}`;
    
    if (!folderName) {
      console.warn(`Dossier manquant pour l'image ID ${img.id}, titre: ${imageTitle}`);
    }
    
    // Générer les URLs au format demandé
    const display_url = generateDisplayImageUrl(folderName, imageTitle);
    const download_url = generateDownloadImageUrl(folderName, imageTitle);
    
    console.log('URLs générées:', {
      id: img.id,
      folder: folderName,
      title: imageTitle,
      display: display_url,
      download: download_url
    });
    
    return {
      ...img,
      // Utiliser directement les nouvelles URLs sans validation additionnelle
      display_url: display_url, 
      download_url: download_url,
      // Pour rétrocompatibilité
      url: download_url,
      url_miniature: display_url,
      // Parser les tags
      tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
    };
  });
  
  return transformedData;
}
