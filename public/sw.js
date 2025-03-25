
// Service Worker pour le cache des images
const CACHE_NAME = 'stimergie-images-cache-v1';
const IMAGE_HOSTS = ['stimergie.fr'];
const MAX_CACHE_SIZE = 300; // Nombre maximum d'entrées dans le cache

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
  const url = new URL(event.request.url);
  
  // Ne traiter que les requêtes d'images depuis les hôtes autorisés
  const isImageRequest = event.request.destination === 'image' || 
                         url.pathname.match(/\.(jpe?g|png|gif|webp|svg)$/i);
  const isAllowedHost = IMAGE_HOSTS.some(host => url.hostname.includes(host));
  
  if (isImageRequest && isAllowedHost) {
    event.respondWith(cacheFirst(event.request));
  }
});

// Stratégie Cache-First avec mise à jour en arrière-plan
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Si en cache, mettre à jour le cache en arrière-plan (stale-while-revalidate)
      updateCache(request).catch(console.error);
      return cachedResponse;
    }
    
    // Si pas en cache, récupérer depuis le réseau et mettre en cache
    return await updateCache(request);
  } catch (error) {
    console.error('Service Worker: Erreur de récupération', error);
    
    // Tenter de retourner une version en cache même si la mise à jour a échoué
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    
    // En dernier recours, retourner une erreur
    return new Response('Network error', { status: 503, statusText: 'Service Unavailable' });
  }
}

// Mettre à jour le cache
async function updateCache(request) {
  const cache = await caches.open(CACHE_NAME);
  
  // Vérifier la taille du cache et nettoyer si nécessaire
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_SIZE) {
    // Supprimer les 30 plus anciens éléments
    const keysToDelete = keys.slice(0, 30);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
  
  try {
    const response = await fetch(request.clone(), {
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (response.ok && (response.status === 200 || response.status === 304)) {
      // Stocker une copie de la réponse dans le cache
      const responseCopy = response.clone();
      
      // Ajouter des en-têtes de cache pour une durée prolongée
      const headers = new Headers(responseCopy.headers);
      headers.set('Cache-Control', 'public, max-age=31536000, immutable'); // 1 an
      
      const cachedResponse = new Response(
        await responseCopy.blob(),
        {
          status: responseCopy.status,
          statusText: responseCopy.statusText,
          headers: headers
        }
      );
      
      await cache.put(request, cachedResponse);
    }
    
    return response;
  } catch (error) {
    console.error('Service Worker: Erreur réseau', error);
    throw error;
  }
}
