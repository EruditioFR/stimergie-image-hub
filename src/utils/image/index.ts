
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
