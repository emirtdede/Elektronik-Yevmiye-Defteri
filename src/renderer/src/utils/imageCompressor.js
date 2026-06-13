/**
 * Canvas API utility to compress an image file/blob to WebP format
 * and scale its maximum width to 1200px while maintaining aspect ratio.
 * 
 * @param {File|Blob} file The input image file
 * @param {number} maxWidth The maximum allowed width
 * @param {number} quality The quality of WebP output (0.0 to 1.0)
 * @returns {Promise<string>} A promise resolving to the compressed WebP base64 DataURL
 */
export const compressImage = (file, maxWidth = 1200, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch (err) {
          // Fallback if browser doesn't support toDataURL 'image/webp'
          try {
            const dataUrl = canvas.toDataURL('image/jpeg', quality);
            resolve(dataUrl);
          } catch (fallbackErr) {
            reject(fallbackErr);
          }
        }
      };
      img.onerror = (err) => reject(new Error('Görsel yüklenemedi.'));
      img.src = e.target.result;
    };
    reader.onerror = (err) => reject(new Error('Dosya okunamadı.'));
    reader.readAsDataURL(file);
  });
};
