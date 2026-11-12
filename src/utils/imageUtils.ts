/**
 * Utility functions for optimizing and normalizing chart images
 * Ensures all images (SVG or high-res raster) are converted to crisp, 
 * lightweight JPEGs suitable for the Gemini Vision model and fast transmission.
 */

const imageCache = new Map<string, { dataUrl: string; mimeType: string }>();

/**
 * Validates magic bytes / header signatures for common web image formats.
 */
export function validateImageSignature(dataUrl: string): { valid: boolean; mimeType: string; format: string } {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return { valid: false, mimeType: '', format: 'unknown' };
  }

  if (dataUrl.startsWith('data:image/svg+xml') || dataUrl.trim().startsWith('<svg')) {
    return { valid: true, mimeType: 'image/svg+xml', format: 'svg' };
  }

  // Extract base64 payload
  const commaIdx = dataUrl.indexOf(',');
  const b64 = commaIdx !== -1 ? dataUrl.substring(commaIdx + 1) : dataUrl;

  try {
    const rawHead = atob(b64.substring(0, 32));
    const bytes = new Uint8Array(rawHead.length);
    for (let i = 0; i < rawHead.length; i++) {
      bytes[i] = rawHead.charCodeAt(i);
    }

    // JPEG: FF D8 FF
    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return { valid: true, mimeType: 'image/jpeg', format: 'jpeg' };
    }

    // PNG: 89 50 4E 47 (0x89 'PNG')
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return { valid: true, mimeType: 'image/png', format: 'png' };
    }

    // WebP: RIFF ... WEBP
    if (
      bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
    ) {
      return { valid: true, mimeType: 'image/webp', format: 'webp' };
    }

    // Fallback: If declared as image data URL
    if (dataUrl.startsWith('data:image/jpeg')) return { valid: true, mimeType: 'image/jpeg', format: 'jpeg' };
    if (dataUrl.startsWith('data:image/png')) return { valid: true, mimeType: 'image/png', format: 'png' };
    if (dataUrl.startsWith('data:image/webp')) return { valid: true, mimeType: 'image/webp', format: 'webp' };

    return { valid: false, mimeType: 'unknown', format: 'invalid' };
  } catch {
    return { valid: false, mimeType: 'unknown', format: 'corrupt' };
  }
}

export async function normalizeChartImage(dataUrl: string): Promise<{ dataUrl: string; mimeType: string }> {
  if (!dataUrl) {
    return { dataUrl: '', mimeType: 'image/jpeg' };
  }

  // Fast cache lookup using length + sample hash
  const cacheKey = `${dataUrl.length}_${dataUrl.substring(0, 60)}_${dataUrl.substring(Math.max(0, dataUrl.length - 40))}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  // If already a standard compact JPEG under 350KB, use directly
  if (dataUrl.startsWith('data:image/jpeg') && dataUrl.length < 350000) {
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
          if (typeof atob !== 'undefined') {
            try {
              const binStr = atob(b64);
              const bytes = new Uint8Array(binStr.length);
              for (let i = 0; i < binStr.length; i++) {
                bytes[i] = binStr.charCodeAt(i);
              }
              rawSvg = new TextDecoder('utf-8').decode(bytes);
            } catch {
              rawSvg = atob(b64);
            }
          }
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
        const maxDim = 1600;
        let width = img.naturalWidth || img.width || 1200;
        let height = img.naturalHeight || img.height || 800;

        // Preserve exact aspect ratio strictly — never distort or crop candles/wicks
        if (width > maxDim || height > maxDim) {
          if (width >= height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = Math.max(width, 100);
        canvas.height = Math.max(height, 100);
        const ctx = canvas.getContext('2d', { alpha: false });

        if (ctx) {
          ctx.fillStyle = '#0b0f17';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          // Draw using exact target dimensions preserving aspect ratio
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
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

