
// Service Worker pour le cache des images
const CACHE_NAME = 'stimergie-images-cache-v1';
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
  const url = new URL(event.request.url);
  
  // Ne traiter que les requêtes d'images depuis les hôtes autorisés
  const isImageRequest = event.request.destination === 'image' || 
                         url.pathname.match(/\.(jpe?g|png|gif|webp|svg)$/i);
  const isAllowedHost = IMAGE_HOSTS.some(host => url.hostname.includes(host));
  
  if (isImageRequest && isAllowedHost) {
    // Pour stimergie.fr, toujours utiliser le proxy
    const modifiedRequest = new Request(
      getProxiedUrl(event.request.url),
      {
        mode: 'cors',
        credentials: 'omit',
        headers: event.request.headers
      }
    );
    
    event.respondWith(cacheFirst(modifiedRequest, event.request));
  }
});

// Fonction utilitaire pour contourner CORS
function getProxiedUrl(url) {
  // Utiliser le proxy images.weserv.nl qui préserve les en-têtes binaires
  return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
}

// Stratégie Cache-First avec mise à jour en arrière-plan
async function cacheFirst(proxyRequest, originalRequest) {
  const requestToCache = originalRequest || proxyRequest;
  
  try {
    // Vérifier d'abord dans le cache
    const cachedResponse = await caches.match(requestToCache);
    
    if (cachedResponse) {
      // Si en cache, mettre à jour le cache en arrière-plan
      updateCache(proxyRequest, requestToCache).catch(error => {
        console.warn('Mise à jour du cache en arrière-plan échouée:', error);
      });
      console.log('Service Worker: Réponse du cache pour', requestToCache.url);
      return cachedResponse;
    }
    
    // Si pas en cache, récupérer depuis le réseau via le proxy
    console.log('Service Worker: Récupération depuis le réseau via proxy pour', proxyRequest.url);
    return await updateCache(proxyRequest, requestToCache);
  } catch (error) {
    console.error('Service Worker: Erreur de récupération', error);
    
    // Tenter de retourner une version en cache même si la mise à jour a échoué
    const cachedResponse = await caches.match(requestToCache);
    if (cachedResponse) {
      console.log('Service Worker: Fallback vers le cache pour', requestToCache.url);
      return cachedResponse;
    }
    
    // En dernier recours, essayer d'autres proxys
    try {
      const backupProxyUrl = `https://corsproxy.io/?${encodeURIComponent(originalRequest.url)}`;
      console.log('Service Worker: Essai avec proxy de secours', backupProxyUrl);
      
      const proxyResponse = await fetch(backupProxyUrl, {
        mode: 'cors',
        credentials: 'omit'
      });
      
      if (proxyResponse.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(requestToCache, proxyResponse.clone());
        return proxyResponse;
      }
    } catch (proxyError) {
      console.error('Service Worker: Erreur avec le proxy de secours', proxyError);
    }
    
    // Si tout échoue, retourner une erreur
    return new Response('Network error', { 
      status: 503, 
      statusText: 'Service Unavailable'
    });
  }
}

// Mettre à jour le cache
async function updateCache(proxyRequest, originalRequest) {
  const cache = await caches.open(CACHE_NAME);
  
  // Vérifier la taille du cache et nettoyer si nécessaire
  const keys = await cache.keys();
  if (keys.length > MAX_CACHE_SIZE) {
    // Supprimer les 30 plus anciens éléments
    const keysToDelete = keys.slice(0, 30);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
    console.log(`Service Worker: ${keysToDelete.length} anciens éléments supprimés du cache`);
  }
  
  try {
    console.log('Service Worker: Tentative de récupération via', proxyRequest.url);
    const response = await fetch(proxyRequest, {
      cache: 'no-cache',
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    // Vérifier le type de contenu pour s'assurer que c'est une image
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html')) {
      throw new Error('La réponse contient du HTML et non une image');
    }
    
    const responseCopy = response.clone();
    
    // Ajouter des en-têtes de cache
    const headers = new Headers(responseCopy.headers);
    headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    headers.set('Access-Control-Allow-Origin', '*');
    
    const cachedResponse = new Response(
      await responseCopy.blob(),
      {
        status: responseCopy.status,
        statusText: responseCopy.statusText,
        headers: headers
      }
    );
    
    // Stocker la réponse dans le cache en utilisant la requête originale comme clé
    await cache.put(originalRequest || proxyRequest, cachedResponse);
    console.log('Service Worker: Image mise en cache avec succès', originalRequest ? originalRequest.url : proxyRequest.url);
    
    return response;
  } catch (error) {
    console.error('Service Worker: Erreur réseau', error);
    throw error;
  }
}
