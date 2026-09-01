/**
 * Utility functions for local image handling, compression, and conversion to Base64 data URLs.
 * Ensures uploaded user images are lightweight, fast to load, and safely stored in local state/database.
 */

export interface ProcessedImage {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
}

export const compressImageFile = (
  file: File,
  maxWidth: number = 1400,
  maxHeight: number = 1400,
  quality: number = 0.82
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If not an image, reject
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné n\'est pas une image valide.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier image.'));
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Impossible de charger l\'image.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio constraints
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            maxHeight = Math.round((width * maxHeight) / img.width);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original read result if canvas context fails
          resolve(event.target?.result as string);
          return;
        }

        // Draw and compress image
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Prefer WebP or JPEG for compression
        const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const compressedBase64 = canvas.toDataURL(outputType, quality);
        resolve(compressedBase64);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

export const processMultipleImageFiles = async (
  files: FileList | File[]
): Promise<string[]> => {
  const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
  const compressionPromises = fileArray.map((file) => compressImageFile(file));
  return Promise.all(compressionPromises);
};
