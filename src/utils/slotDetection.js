/**
 * PRD F-07: Automatic Slot Detection from PNG Alpha Channel (JavaScript)
 * Analyzes transparent cutouts, clusters connected components,
 * filters noise (<2% of canvas), and generates ordered numbered slots.
 *
 * @param {string} imageUrl
 * @returns {Promise<{ slots: Array, width: number, height: number }>}
 */
export async function detectSlotsFromImage(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      const maxDim = 800;
      const scale = Math.min(1, maxDim / Math.max(width, height));
      const scaledW = Math.round(width * scale);
      const scaledH = Math.round(height * scale);

      canvas.width = scaledW;
      canvas.height = scaledH;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      ctx.drawImage(img, 0, 0, scaledW, scaledH);
      const imgData = ctx.getImageData(0, 0, scaledW, scaledH);
      const data = imgData.data;

      const isTransparent = new Uint8Array(scaledW * scaledH);
      for (let i = 0; i < isTransparent.length; i++) {
        const alpha = data[i * 4 + 3];
        if (alpha < 40) {
          isTransparent[i] = 1;
        }
      }

      const visited = new Uint8Array(scaledW * scaledH);
      const rawBoxes = [];

      for (let y = 0; y < scaledH; y++) {
        for (let x = 0; x < scaledW; x++) {
          const idx = y * scaledW + x;
          if (isTransparent[idx] === 1 && visited[idx] === 0) {
            let minX = x;
            let maxX = x;
            let minY = y;
            let maxY = y;
            let pixelCount = 0;

            const queue = [idx];
            visited[idx] = 1;

            while (queue.length > 0) {
              const curr = queue.pop();
              const cx = curr % scaledW;
              const cy = Math.floor(curr / scaledW);
              pixelCount++;

              if (cx < minX) minX = cx;
              if (cx > maxX) maxX = cx;
              if (cy < minY) minY = cy;
              if (cy > maxY) maxY = cy;

              const neighbors = [
                cy > 0 ? (cy - 1) * scaledW + cx : -1,
                cy < scaledH - 1 ? (cy + 1) * scaledW + cx : -1,
                cx > 0 ? cy * scaledW + (cx - 1) : -1,
                cx < scaledW - 1 ? cy * scaledW + (cx + 1) : -1,
              ];

              for (const n of neighbors) {
                if (n >= 0 && visited[n] === 0 && isTransparent[n] === 1) {
                  visited[n] = 1;
                  queue.push(n);
                }
              }
            }

            rawBoxes.push({ minX, maxX, minY, maxY, pixelCount });
          }
        }
      }

      const totalPixels = scaledW * scaledH;
      const minPixelThreshold = totalPixels * 0.02;

      const validBoxes = rawBoxes.filter((b) => {
        const boxArea = (b.maxX - b.minX + 1) * (b.maxY - b.minY + 1);
        return b.pixelCount >= minPixelThreshold && boxArea >= minPixelThreshold;
      });

      const invScale = 1 / scale;
      const slots = validBoxes.map((b, idx) => {
        const x = Math.round(b.minX * invScale);
        const y = Math.round(b.minY * invScale);
        const w = Math.round((b.maxX - b.minX + 1) * invScale);
        const h = Math.round((b.maxY - b.minY + 1) * invScale);
        return {
          id: `slot-${idx + 1}`,
          order: idx + 1,
          x,
          y,
          w,
          h,
        };
      });

      slots.sort((a, b) => {
        const rowDiff = Math.abs(a.y - b.y);
        const threshold = Math.min(a.h, b.h) * 0.35;
        if (rowDiff < threshold) {
          return a.x - b.x;
        }
        return a.y - b.y;
      });

      slots.forEach((s, i) => {
        s.order = i + 1;
        s.id = `slot-${i + 1}`;
      });

      resolve({ slots, width, height });
    };

    img.onerror = () => {
      reject(new Error('Gagal memuat gambar overlay template'));
    };

    img.src = imageUrl;
  });
}
