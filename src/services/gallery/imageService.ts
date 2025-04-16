


import { supabase } from "@/integrations/supabase/client";
import { parseTagsString } from "@/utils/imageUtils";
import { toast } from "sonner";
import { buildGalleryQuery, applyPaginationToQuery } from "./queryBuilder";
import { generateDisplayImageUrl, generateDownloadImageSDUrl, generateDownloadImageHDUrl } from "@/utils/image/imageUrlGenerator";
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
    // Utiliser l'URL directement depuis la base de données pour la version SD
    const download_url = generateDownloadImageHDUrl(folderName, imageTitle);
    
    // Assurer que les dimensions sont des nombres valides
    const width = parseInt(img.width) || 0;
    const height = parseInt(img.height) || 0;
    
    // Déterminer l'orientation basée sur les dimensions réelles
    let orientation = img.orientation || 'landscape';
    if (width > 0 && height > 0) {
      if (width > height) {
        orientation = 'landscape';
      } else if (height > width) {
        orientation = 'portrait';
      } else {
        orientation = 'square';
      }
    }
    
    console.log(`Image ${img.id} (${imageTitle}): dims=${width}x${height}, orientation=${orientation}`);
    
    return {
      ...img,
      // Utiliser directement les nouvelles URLs sans validation additionnelle
      display_url: display_url, 
      download_url: download_url,
      // Utiliser l'URL de Supabase pour le téléchargement SD
      download_url_sd: img.url || '',
      // Pour rétrocompatibilité
      url: download_url,
      url_miniature: display_url,
      // Assurer que width et height sont des nombres
      width: width,
      height: height,
      // Assurer que l'orientation est correcte selon les dimensions
      orientation: orientation,
      // Parser les tags
      tags: typeof img.tags === 'string' ? parseTagsString(img.tags) : img.tags
    };
  });
  
  return transformedData;
}
