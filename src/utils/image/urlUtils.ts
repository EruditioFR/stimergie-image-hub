
/**
 * URL related utility functions
 */

// Available CORS proxies for rotation
const PROXIES = [
  'https://images.weserv.nl/?url=',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url='
];

// Cache for best proxies
const bestProxyCache = new Map<string, string>();

/**
 * Checks if a URL is from Dropbox
 */
export function isDropboxUrl(url: string): boolean {
  return url.includes('dropbox.com') || url.includes('dl.dropboxusercontent.com');
}

/**
 * Extracts direct download link from a Dropbox URL
 */
export function getDropboxDownloadUrl(url: string): string {
  // If already a direct link, return as is
  if (url.includes('dl.dropboxusercontent.com') || url.includes('dl=1')) {
    return url;
  }
  
  // Convert to direct download link
  if (url.includes('?')) {
    return `${url}&dl=1`;
  } else {
    return `${url}?dl=1`;
  }
}

/**
 * Gets a proxied URL to bypass CORS issues with improved proxy selection
 */
export function getProxiedUrl(url: string, forceProxy = false): string {
  // Don't proxy if not needed
  if (!forceProxy && (url.includes(window.location.hostname) || url.startsWith('blob:') || url.startsWith('data:'))) {
    return url;
  }
  
  // For problematic domains or when proxy is forced, always use proxy
  const domain = extractDomain(url);
  
  // Select the best proxy for this domain (cached or default)
  let proxyIndex = 0;
  if (bestProxyCache.has(domain)) {
    const bestProxy = bestProxyCache.get(domain)!;
    proxyIndex = PROXIES.indexOf(bestProxy);
    if (proxyIndex === -1) proxyIndex = 0;
  }
  
  const selectedProxy = PROXIES[proxyIndex];
  return `${selectedProxy}${encodeURIComponent(url)}`;
}

/**
 * Updates the best proxy for a domain based on successful fetches
 */
export function updateBestProxy(domain: string, proxyUrl: string): void {
  // Extract which proxy was used
  for (let i = 0; i < PROXIES.length; i++) {
    if (proxyUrl.startsWith(PROXIES[i])) {
      bestProxyCache.set(domain, PROXIES[i]);
      break;
    }
  }
}

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return hostname;
  } catch (e) {
    return url;
  }
}
