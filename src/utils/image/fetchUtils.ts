
import { isDropboxUrl, getDropboxDownloadUrl, getProxiedUrl } from './urlUtils';

// Cache pour les réponses de téléchargement d'images
// Utilisation d'une Map pour stocker les promesses de téléchargement
const fetchCache = new Map<string, Promise<Blob | null>>();

// Cache secondaire pour les URLs d'images après transformation
const processedUrlCache = new Map<string, string>();

// Taille maximale du cache (nombre d'entrées)
const MAX_CACHE_SIZE = 200; // Increased from 100 to 200

// Pour suivre l'ordre d'utilisation des entrées du cache (LRU - Least Recently Used)
let cacheUsageOrder: string[] = [];

/**
 * Vérifie si un blob est probablement du contenu HTML et non une image
 */
export function isHtmlContent(blob: Blob): boolean {
  // Vérifier le type MIME
  if (blob.type.includes('text/html') || blob.type.includes('application/xhtml+xml')) {
    return true;
  }
  
  // Les petits fichiers sont probablement des pages d'erreur
  if (blob.size < 1000) {
    return true;
  }
  
  return false;
}

/**
 * Gère la politique du cache (LRU - Least Recently Used)
 * Supprime les entrées les moins récemment utilisées lorsque le cache atteint sa taille maximale
 */
function manageCacheSize(url: string): void {
  // Mettre à jour l'ordre d'utilisation
  // Retirer l'URL si elle existe déjà dans l'ordre
  cacheUsageOrder = cacheUsageOrder.filter(cachedUrl => cachedUrl !== url);
  // Ajouter l'URL à la fin (plus récemment utilisée)
  cacheUsageOrder.push(url);
  
  // Si le cache dépasse la taille maximale, supprimer les entrées les moins récemment utilisées
  if (cacheUsageOrder.length > MAX_CACHE_SIZE) {
    const urlsToRemove = cacheUsageOrder.slice(0, cacheUsageOrder.length - MAX_CACHE_SIZE);
    urlsToRemove.forEach(urlToRemove => {
      fetchCache.delete(urlToRemove);
      processedUrlCache.delete(urlToRemove);
    });
    // Mettre à jour l'ordre d'utilisation
    cacheUsageOrder = cacheUsageOrder.slice(-(MAX_CACHE_SIZE));
  }
}

/**
 * Génère une clé de cache qui inclut les paramètres essentiels de l'URL
 * pour éviter les doublons dans le cache
 */
function generateCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    // Ne garder que le hostname, le pathname et les paramètres essentiels
    const essentialParams = new URLSearchParams();
    
    // Filtrer seulement les paramètres pertinents pour le cache
    const relevantParams = ['w', 'h', 'q', 'width', 'height', 'quality', 'size'];
    for (const param of relevantParams) {
      if (urlObj.searchParams.has(param)) {
        essentialParams.set(param, urlObj.searchParams.get(param)!);
      }
    }
    
    // Construire une clé de cache normalisée
    return `${urlObj.origin}${urlObj.pathname}${essentialParams.toString() ? '?' + essentialParams.toString() : ''}`;
  } catch (e) {
    // En cas d'erreur, utiliser l'URL complète comme clé
    return url;
  }
}

/**
 * Télécharge une image depuis n'importe quelle source avec mise en cache
 */
export async function fetchImageAsBlob(url: string): Promise<Blob | null> {
  // Générer une clé de cache normalisée
  const cacheKey = generateCacheKey(url);
  
  // Retourner la réponse mise en cache si disponible
  if (fetchCache.has(cacheKey)) {
    // Mettre à jour l'ordre d'utilisation du cache
    manageCacheSize(cacheKey);
    return fetchCache.get(cacheKey);
  }
  
  // Créer une promesse de téléchargement et la stocker dans le cache avant d'attendre le résultat
  const fetchPromise = fetchImageAsBlobInternal(url, cacheKey);
  fetchCache.set(cacheKey, fetchPromise);
  manageCacheSize(cacheKey);
  
  // Retourner la promesse mise en cache
  return fetchPromise;
}

/**
 * Détermine si une URL d'image est déjà dans le cache du navigateur
 */
function isImageInBrowserCache(url: string): Promise<boolean> {
  return new Promise(resolve => {
    // Vérifier si l'image est dans le cache du navigateur en utilisant la méthode de performance
    const img = new Image();
    let isCached = false;
    
    // L'image est chargée rapidement si elle est dans le cache
    img.onload = () => {
      // Vérifier le temps de chargement - moins de 20ms suggère un chargement depuis le cache
      resolve(isCached);
    };
    
    img.onerror = () => {
      resolve(false);
    };
    
    // Commencer à vérifier le temps après la définition de src
    img.src = url;
    // Utiliser le temps actuel pour vérifier la vitesse de chargement
    const startTime = performance.now();
    
    // Après un court laps de temps, vérifier si l'image est complètement chargée
    setTimeout(() => {
      if (img.complete && img.naturalWidth > 0) {
        const loadTime = performance.now() - startTime;
        isCached = loadTime < 20; // Considéré comme mis en cache si chargé en moins de 20ms
      }
    }, 10);
  });
}

/**
 * Implémentation interne du téléchargement d'images
 */
async function fetchImageAsBlobInternal(url: string, cacheKey: string): Promise<Blob | null> {
  try {
    // Vérifier si nous avons déjà une URL transformée pour cette URL
    if (processedUrlCache.has(cacheKey)) {
      const processedUrl = processedUrlCache.get(cacheKey)!;
      console.log(`Using processed URL from cache: ${processedUrl}`);
      url = processedUrl;
    } else {
      console.log(`Downloading: ${url}`);
    }
    
    let fetchUrl;
    
    // Traiter différemment les URLs Dropbox
    if (isDropboxUrl(url)) {
      const directDownloadUrl = getDropboxDownloadUrl(url);
      console.log(`Dropbox URL converted to direct URL: ${directDownloadUrl}`);
      fetchUrl = getProxiedUrl(directDownloadUrl);
    } else {
      fetchUrl = getProxiedUrl(url);
    }
    
    // Stocker l'URL transformée dans le cache
    processedUrlCache.set(cacheKey, fetchUrl);
    
    // Vérifier si l'image est dans le cache du navigateur
    const isInBrowserCache = await isImageInBrowserCache(fetchUrl);
    if (isInBrowserCache) {
      console.log(`Image found in browser cache: ${url}`);
    }
    
    // Configurer fetch avec timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // Reduced from 10s to 8s
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'force-cache', // Utiliser le cache HTTP quand possible
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*, */*;q=0.8',
        'Cache-Control': 'max-age=604800', // Cache d'une semaine
        'Pragma': 'no-cache'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Download failed: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      console.error(`HTML response detected via headers: ${contentType}`);
      return null;
    }
    
    const blob = await response.blob();
    if (blob.size === 0) {
      console.error("Empty download blob");
      return null;
    }
    
    // Vérifier si la réponse est potentiellement HTML (page d'erreur) et non une image
    if (isHtmlContent(blob)) {
      console.error("Response seems to be an HTML page and not an image");
      return null;
    }
    
    // Stocker le blob dans le cache d'application si disponible
    try {
      if ('caches' in window) {
        const cache = await caches.open('images-cache-v1');
        const response = new Response(blob.slice(0), {
          headers: {
            'Content-Type': blob.type,
            'Cache-Control': 'max-age=604800', // Cache d'une semaine
          }
        });
        cache.put(fetchUrl, response);
        console.log(`Image stored in application cache: ${url}`);
      }
    } catch (e) {
      console.warn("Failed to store image in application cache:", e);
    }
    
    console.log(`Image downloaded successfully, type: ${blob.type}, size: ${blob.size} bytes`);
    return blob;
  } catch (error) {
    console.error("Error during download:", error);
    return null;
  }
}
