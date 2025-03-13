
/**
 * Détermine l'extension de fichier à partir du type MIME ou de l'URL
 */
export function determineFileExtension(blob: Blob, url: string): string {
  let extension = 'jpg'; // Extension par défaut
  
  if (blob.type) {
    // Extraire l'extension du type MIME (ex: image/jpeg -> jpeg)
    const mimeType = blob.type.split('/');
    if (mimeType.length > 1 && mimeType[1]) {
      extension = mimeType[1].split(';')[0]; // Enlever les paramètres éventuels
    }
  } else if (url.includes('.')) {
    // Extraire l'extension de l'URL (ex: image.png -> png)
    const urlParts = url.split('?')[0]; // Ignorer les paramètres de l'URL
    const extPart = urlParts.split('.').pop();
    if (extPart) {
      extension = extPart.toLowerCase();
    }
  }
  
  // Normaliser certaines extensions
  if (extension === 'jpeg') extension = 'jpg';
  if (extension === 'svg+xml') extension = 'svg';
  
  return extension;
}

/**
 * Génère un nom de fichier normalisé
 */
export function generateNormalizedFilename(title: string | undefined, index: number, extension: string): string {
  // Utiliser le titre de l'image si disponible, sinon un numéro
  let filename = title ? title.trim() : `image_${index + 1}`;
  
  // Remplacer les caractères problématiques dans le nom de fichier
  filename = filename.replace(/[\/\\:*?"<>|]/g, '_');
  
  // Ajouter l'extension si elle n'est pas déjà présente
  if (!filename.toLowerCase().endsWith(`.${extension}`)) {
    filename = `${filename}.${extension}`;
  }
  
  return filename;
}
