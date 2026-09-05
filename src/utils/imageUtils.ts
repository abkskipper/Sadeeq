/**
 * Utility functions for optimizing and normalizing chart images
 * Ensures all images (SVG or high-res raster) are converted to crisp, 
 * lightweight JPEGs suitable for the Gemini Vision model and fast transmission.
 */

const imageCache = new Map<string, { dataUrl: string; mimeType: string }>();

export async function normalizeChartImage(dataUrl: string): Promise<{ dataUrl: string; mimeType: string }> {
  if (!dataUrl) {
    return { dataUrl: '', mimeType: 'image/jpeg' };
  }

  // Fast cache lookup using length + sample hash
  const cacheKey = `${dataUrl.length}_${dataUrl.substring(0, 60)}_${dataUrl.substring(Math.max(0, dataUrl.length - 40))}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  // If already a standard compact JPEG under 200KB, skip canvas rasterization
  if (dataUrl.startsWith('data:image/jpeg') && dataUrl.length < 200000) {
    const res = { dataUrl, mimeType: 'image/jpeg' };
    imageCache.set(cacheKey, res);
    return res;
  }

  return new Promise((resolve) => {
    let srcToLoad = dataUrl;
    let objectUrlToRevoke: string | null = null;

    if (dataUrl.startsWith('data:image/svg+xml')) {
      try {
        let rawSvg = '';
        if (dataUrl.includes('base64,')) {
          const b64 = dataUrl.split('base64,')[1];
          rawSvg = typeof atob !== 'undefined' ? atob(b64) : '';
        } else if (dataUrl.includes('utf8,')) {
          rawSvg = decodeURIComponent(dataUrl.split('utf8,')[1]);
        } else {
          const commaIdx = dataUrl.indexOf(',');
          if (commaIdx !== -1) {
            rawSvg = decodeURIComponent(dataUrl.substring(commaIdx + 1));
          }
        }
        if (rawSvg) {
          const blob = new Blob([rawSvg], { type: 'image/svg+xml;charset=utf-8' });
          srcToLoad = URL.createObjectURL(blob);
          objectUrlToRevoke = srcToLoad;
        }
      } catch {
        srcToLoad = dataUrl;
      }
    } else if (dataUrl.startsWith('<svg')) {
      try {
        const blob = new Blob([dataUrl], { type: 'image/svg+xml;charset=utf-8' });
        srcToLoad = URL.createObjectURL(blob);
        objectUrlToRevoke = srcToLoad;
      } catch {
        srcToLoad = dataUrl;
      }
    }

    const img = new Image();
    if (srcToLoad.startsWith('http://') || srcToLoad.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    const cleanup = () => {
      if (objectUrlToRevoke) {
        try {
          URL.revokeObjectURL(objectUrlToRevoke);
        } catch {
          // ignore
        }
      }
    };

    // Safety timeout in case img onload hangs
    const loadTimeout = setTimeout(() => {
      cleanup();
      const fallback = { dataUrl, mimeType: dataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png' };
      imageCache.set(cacheKey, fallback);
      resolve(fallback);
    }, 4000);

    img.onload = () => {
      clearTimeout(loadTimeout);
      try {
        const maxW = 1100;
        const maxH = 680;
        let width = img.naturalWidth || img.width || 1000;
        let height = img.naturalHeight || img.height || 620;

        if (width > maxW || height > maxH) {
          const ratio = Math.min(maxW / width, maxH / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 480);
        canvas.height = Math.max(height, 320);
        const ctx = canvas.getContext('2d', { alpha: false });

        if (ctx) {
          ctx.fillStyle = '#0b0f17';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.80);
          cleanup();
          const result = { dataUrl: compressedUrl, mimeType: 'image/jpeg' };
          imageCache.set(cacheKey, result);
          resolve(result);
          return;
        }
      } catch (err) {
        console.warn('Canvas rasterization fallback:', err);
      }
      cleanup();
      const fallback = { dataUrl, mimeType: dataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png' };
      imageCache.set(cacheKey, fallback);
      resolve(fallback);
    };

    img.onerror = () => {
      clearTimeout(loadTimeout);
      cleanup();
      const fallback = { dataUrl, mimeType: dataUrl.startsWith('data:image/jpeg') ? 'image/jpeg' : 'image/png' };
      imageCache.set(cacheKey, fallback);
      resolve(fallback);
    };

    img.src = srcToLoad;
  });
}

