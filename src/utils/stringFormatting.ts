
/**
 * Truncates a string to the specified length and adds an ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
}

/**
 * Formats string as an HTML-friendly ID or class name
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '-')      // Replace spaces with -
    .replace(/--+/g, '-')      // Replace multiple - with single -
    .trim();                   // Trim - from start and end of text
}
