/**
 * Utility functions for local image handling, compression, and conversion to Base64 data URLs.
 * Ensures uploaded user images are lightweight, fast to load, and safely stored in local state/database.
 */

export interface ProcessedImage {
  id: string;
  dataUrl: string;
  name: string;
  size: number;
  originalSize?: number;
  savingsPercent?: number;
}

export const formatBytes = (bytes: number, decimals: number = 1): string => {
  if (bytes === 0) return '0 Octets';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Octets', 'Ko', 'Mo', 'Go'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

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
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Accurate aspect ratio constraint calculation
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
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

        // Draw and compress image with high quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try WebP compression for superior efficiency, fallback to JPEG
        let compressedBase64: string;
        try {
          compressedBase64 = canvas.toDataURL('image/webp', quality);
          // Check if browser actually supported webp conversion (some older browsers return png)
          if (!compressedBase64.startsWith('data:image/webp')) {
            compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          }
        } catch {
          compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        }

        resolve(compressedBase64);
      };

      img.src = event.target?.result as string;
    };

    reader.readAsDataURL(file);
  });
};

export const compressImageWithStats = async (
  file: File,
  maxWidth: number = 1400,
  maxHeight: number = 1400,
  quality: number = 0.82
): Promise<ProcessedImage> => {
  const originalSize = file.size;
  const dataUrl = await compressImageFile(file, maxWidth, maxHeight, quality);
  
  // Approximate base64 byte size
  const stringLength = dataUrl.length - 'data:image/webp;base64,'.length;
  const sizeInBytes = Math.round((stringLength * 3) / 4);
  const savingsPercent = originalSize > sizeInBytes 
    ? Math.round(((originalSize - sizeInBytes) / originalSize) * 100) 
    : 0;

  return {
    id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    dataUrl,
    name: file.name,
    size: sizeInBytes,
    originalSize,
    savingsPercent,
  };
};

export const processMultipleImageFiles = async (
  files: FileList | File[]
): Promise<string[]> => {
  const fileArray = Array.from(files).filter((file) => file.type.startsWith('image/'));
  const compressionPromises = fileArray.map((file) => compressImageFile(file));
  return Promise.all(compressionPromises);
};
