
// Service Worker pour le cache des images
const CACHE_NAME = 'stimergie-images-cache-v2';
const IMAGE_HOSTS = ['stimergie.fr'];
const MAX_CACHE_SIZE = 300;

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
    // Toujours utiliser le cache pour stimergie.fr
    event.respondWith(cacheFirstStrategy(event.request));
  }
});

// Stratégie cache-first pour les images
async function cacheFirstStrategy(request) {
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
    // 2. Si pas en cache, récupérer depuis le réseau
    return await fetchWithRetry(request, cache);
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
  fetchWithRetry(request, cache)
    .catch(error => console.warn('Service Worker: Mise à jour en arrière-plan échouée:', error));
}

// Fonction avec stratégie de retry
async function fetchWithRetry(request, cache) {
  const originalUrl = request.url;
  const maxRetries = 3;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`Service Worker: Tentative ${attempt+1}/${maxRetries} pour ${originalUrl}`);
      
      const fetchOptions = {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        redirect: 'follow',
        headers: new Headers({
          'Accept': 'image/*, */*;q=0.8',
          'Cache-Control': 'max-age=31536000'
        })
      };
      
      // Pour la dernière tentative, essayer avec no-cors
      if (attempt === maxRetries - 1) {
        fetchOptions.mode = 'no-cors';
      }
      
      const response = await fetch(new Request(originalUrl, fetchOptions));
      
      // Cas spécial pour no-cors
      if (response.type === 'opaque') {
        // On ne peut pas vérifier le statut, alors on assume que c'est bon
        console.log('Service Worker: Réponse opaque acceptée pour', originalUrl);
        
        // Ne pas tenter de mettre en cache les réponses opaques car cela échoue souvent
        return response;
      }
      
      if (!response.ok) {
        throw new Error(`Réponse HTTP ${response.status} pour ${originalUrl}`);
      }
      
      // Vérifier le type de contenu
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('text/html')) {
        throw new Error(`La réponse contient du HTML et non une image: ${contentType}`);
      }
      
      console.log('Service Worker: Récupération réussie pour', originalUrl);
      
      // Tenter de mettre en cache, mais ne pas échouer si la mise en cache échoue
      try {
        // Créer une réponse avec des en-têtes de cache optimisés
        const responseToCache = new Response(
          await response.clone().blob(),
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
        
        // Mettre en cache mais attraper les erreurs
        await cache.put(request, responseToCache).catch(err => {
          console.warn('Service Worker: Échec de mise en cache:', err);
          // Continuer l'exécution même si la mise en cache échoue
        });
        
        console.log('Service Worker: Mise en cache réussie ou ignorée pour', originalUrl);
      } catch (cacheError) {
        // Si la mise en cache échoue, on ignore simplement et on continue
        console.warn('Service Worker: Impossible de mettre en cache:', cacheError);
      }
      
      // Retourner la réponse originale même si la mise en cache a échoué
      return response;
    } catch (error) {
      console.warn(`Service Worker: Erreur tentative ${attempt+1}`, error);
      
      // Dernier essai échoué, lancer l'erreur
      if (attempt === maxRetries - 1) {
        throw error;
      }
      
      // Attendre un peu avant de réessayer
      await new Promise(resolve => setTimeout(resolve, attempt * 500));
    }
  }
  
  throw new Error(`Toutes les tentatives ont échoué pour ${originalUrl}`);
}
