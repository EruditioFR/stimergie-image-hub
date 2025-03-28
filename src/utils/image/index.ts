
// Exporter toutes les fonctionnalités pour faciliter l'importation
export * from './types';
export * from './urlUtils';
export * from './fileUtils';
export * from './fetcher';
export * from './blobUtils';
export * from './cacheManager';
export * from './imageDownloader';
export * from './imageUrlGenerator';

// For backward compatibility
export * from './fetchUtils';

// Fonction de débogage pour les URL d'images
export function debugImageUrl(url: string): void {
  console.log('Image URL:', {
    url,
    isValid: url && url.startsWith('http'),
    length: url?.length || 0,
    containsSpecialChars: /[^a-zA-Z0-9\-_\.\/:]/.test(url)
  });
}

// Fonction pour vider explicitement tous les caches
export function purgeAllImageCaches(): Promise<void> {
  return new Promise((resolve) => {
    try {
      // Import dynamique pour éviter les dépendances circulaires
      import('./cacheManager').then(({ clearAllCaches }) => {
        clearAllCaches();
        console.log('Tous les caches d\'images ont été purgés');
        
        // Attendre un peu pour laisser les opérations de cache se terminer
        setTimeout(() => {
          resolve();
        }, 300);
      });
    } catch (error) {
      console.error('Erreur lors de la purge des caches:', error);
      resolve();
    }
  });
}
