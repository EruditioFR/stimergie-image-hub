/**
 * Format seconds into a human-readable time string
 * @param seconds Number of seconds to format
 * @returns Formatted time string (e.g., "2m 30s" or "45s")
 */
export function formatTime(seconds: number): string {
  if (seconds < 1) {
    return 'Démarrage...';
  }
  
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  
  return `${minutes}m ${secs}s`;
}
