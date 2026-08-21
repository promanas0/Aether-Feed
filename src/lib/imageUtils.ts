/**
 * High-performance client-side image compression utility
 * Resizes and compresses images using HTML5 Canvas to prevent LocalStorage quota overflow
 * and keep the app lightning fast across mobile and PC.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export const compressImage = (
  fileOrDataUrl: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> => {
  const {
    maxWidth = 1200,
    maxHeight = 1200,
    quality = 0.82,
    format = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const processImage = (src: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate aspect ratio preserving dimensions
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src);
          return;
        }

        // Fill background for transparent PNGs converted to JPEG
        if (format === 'image/jpeg') {
          ctx.fillStyle = '#1E293B';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        try {
          const compressedDataUrl = canvas.toDataURL(format, quality);
          resolve(compressedDataUrl);
        } catch {
          // Fallback to original if canvas export fails
          resolve(src);
        }
      };

      img.onerror = () => {
        // Fallback to original string on error
        resolve(src);
      };

      img.src = src;
    };

    if (typeof fileOrDataUrl === 'string') {
      // If it's already an external HTTP URL (Unsplash etc.), return as is
      if (fileOrDataUrl.startsWith('http://') || fileOrDataUrl.startsWith('https://')) {
        resolve(fileOrDataUrl);
        return;
      }
      processImage(fileOrDataUrl);
    } else if (fileOrDataUrl && typeof fileOrDataUrl === 'object') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          processImage(result);
        } else {
          reject(new Error('Failed to read image file.'));
        }
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(fileOrDataUrl as Blob);
    } else {
      resolve('');
    }
  });
};

/**
 * Avatar compression preset: Max 320x320 (~15-30KB)
 */
export const compressAvatar = (fileOrDataUrl: File | Blob | string): Promise<string> => {
  return compressImage(fileOrDataUrl, {
    maxWidth: 320,
    maxHeight: 320,
    quality: 0.85,
    format: 'image/jpeg',
  });
};

/**
 * Banner / Cover photo compression preset: Max 1200x500 (~50-80KB)
 */
export const compressBanner = (fileOrDataUrl: File | Blob | string): Promise<string> => {
  return compressImage(fileOrDataUrl, {
    maxWidth: 1200,
    maxHeight: 500,
    quality: 0.82,
    format: 'image/jpeg',
  });
};

/**
 * Feed post image compression preset: Max 1200x1200 (~60-100KB)
 */
export const compressPostImage = (fileOrDataUrl: File | Blob | string): Promise<string> => {
  return compressImage(fileOrDataUrl, {
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.82,
    format: 'image/jpeg',
  });
};
