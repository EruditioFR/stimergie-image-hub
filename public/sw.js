
// Service Worker pour le cache des images
const CACHE_NAME = 'stimergie-images-cache-v1';
const IMAGE_HOSTS = ['stimergie.fr'];
const MAX_CACHE_SIZE = 300;
const BACKUP_PROXIES = [
  'https://images.weserv.nl/?url=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installation');
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activation');
  event.waitUntil(
    // Nettoyer les anciens caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Suppression de l\'ancien cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Intercepter les requêtes
self.addEventListener('fetch', (event) => {
  // Ne pas intercepter les requêtes de l'API ou non-GET
  if (event.request.method !== 'GET' || 
      event.request.url.includes('/auth/') || 
      event.request.url.includes('/api/')) {
    return;
  }
  
  const url = new URL(event.request.url);
  
  // Ne traiter que les requêtes d'images depuis les hôtes autorisés
  const isImageRequest = event.request.destination === 'image' || 
                         url.pathname.match(/\.(jpe?g|png|gif|webp|svg)$/i);
  const isAllowedHost = IMAGE_HOSTS.some(host => url.hostname.includes(host));
  
  if (isImageRequest && isAllowedHost) {
    // Toujours utiliser le proxy pour stimergie.fr
    event.respondWith(smartCacheStrategy(event.request));
  }
});

// Stratégie de cache intelligente avec plusieurs niveaux de fallback
async function smartCacheStrategy(request) {
  const originalUrl = request.url;
  console.log('Service Worker: Traitement de', originalUrl);
  
  try {
    // 1. Essayer d'abord depuis le cache
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('Service Worker: Cache hit pour', originalUrl);
      // Mettre à jour le cache en arrière-plan sans attendre
      updateCacheInBackground(request, cache);
      return cachedResponse;
    }
    
    console.log('Service Worker: Cache miss pour', originalUrl);
    // 2. Si pas en cache, récupérer depuis le réseau avec notre stratégie robuste
    return await fetchWithFallbacks(request, cache);
  } catch (error) {
    console.error('Service Worker: Erreur générale', error);
    
    // Dernier recours: version en cache même périmée ou réponse d'erreur
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        console.log('Service Worker: Fallback vers cache périmé pour', originalUrl);
        return cachedResponse;
      }
    } catch (e) {
      console.error('Service Worker: Erreur lors du fallback vers cache', e);
    }
    
    // Si tout a échoué, retourner une image d'erreur ou une réponse d'erreur
    return new Response('Network error', { 
      status: 503, 
      statusText: 'Service Unavailable',
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-store'
      }
    });
  }
}

// Mise à jour du cache en arrière-plan
function updateCacheInBackground(request, cache) {
  fetchWithFallbacks(request, cache)
    .catch(error => console.warn('Service Worker: Mise à jour en arrière-plan échouée:', error));
}

// Fonction avec stratégie de retry et fallbacks
async function fetchWithFallbacks(request, cache) {
  const originalUrl = request.url;
  const maxRetries = 3;
  
  // Essayer d'abord avec un proxy principal
  let proxyUrl = getProxiedUrl(originalUrl, 0);
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Service Worker: Tentative ${attempt+1}/${maxRetries} via ${proxyUrl}`);
      
      const fetchOptions = {
        mode: attempt === maxRetries - 1 ? 'no-cors' : 'cors',
        credentials: 'omit',
        redirect: 'follow',
        headers: new Headers({
          'Accept': 'image/*, */*;q=0.8',
          'Cache-Control': 'max-age=31536000'
        })
      };
      
      // Utiliser un proxy différent à chaque tentative
      if (attempt > 0) {
        proxyUrl = getProxiedUrl(originalUrl, attempt);
      }
      
      const response = await fetch(new Request(proxyUrl, fetchOptions));
      
      // Cas spécial pour no-cors
      if (response.type === 'opaque') {
        // On ne peut pas vérifier le statut, alors on assume que c'est bon
        console.log('Service Worker: Réponse opaque acceptée pour', originalUrl);
        await cache.put(request, response.clone());
        return response;
      }
      
      if (!response.ok) {
        throw new Error(`Réponse HTTP ${response.status} pour ${proxyUrl}`);
      }
      
      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`La réponse contient du HTML et non une image: ${contentType}`);
      }
      
      console.log('Service Worker: Mise en cache réussie pour', originalUrl);
      
      // Créer une réponse avec des en-têtes de cache optimisés
      const enhancedResponse = new Response(
        await response.blob(),
        {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers({
            'Content-Type': response.headers.get('Content-Type') || 'image/jpeg',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'Access-Control-Allow-Origin': '*'
          })
        }
      );
      
      // Mettre en cache et retourner
      await cache.put(request, enhancedResponse.clone());
      return enhancedResponse;
    } catch (error) {
      console.warn(`Service Worker: Erreur tentative ${attempt+1}`, error);
      
      // Dernier essai, réessayer avec un autre proxy
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }
  
  throw new Error(`Toutes les tentatives ont échoué pour ${originalUrl}`);
}

// Fonction utilitaire pour contourner CORS avec différents proxys
function getProxiedUrl(url, proxyIndex = 0) {
  // Rotation entre différents proxys selon l'index
  const proxyUrl = BACKUP_PROXIES[proxyIndex % BACKUP_PROXIES.length];
  return `${proxyUrl}${encodeURIComponent(url)}`;
}
