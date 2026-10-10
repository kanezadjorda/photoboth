/**
 * High-res canvas photo compositor (JavaScript)
 * Composites captured photos and template overlay at 300 DPI for physical printing.
 */

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src ? src.substring(0, 50) : ''}...`));
    img.src = src;
  });
}

function drawImageCover(ctx, img, x, y, w, h) {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;

  let sx = 0;
  let sy = 0;
  let sw = img.width;
  let sh = img.height;

  if (imgRatio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

/**
 * @param {Object} options
 * @param {Object} options.template
 * @param {string[]} options.photos
 * @param {string} [options.sessionId]
 * @param {boolean} [options.printSessionId]
 * @param {boolean} [options.duplicateStripOn4R]
 * @returns {Promise<string>} Data URL
 */
export async function compositePhotoStrip(options) {
  const { template, photos, sessionId, printSessionId, duplicateStripOn4R = false } = options;

  const isStrip = template.paper === '2x6in';
  const shouldDuplicate = isStrip && duplicateStripOn4R;

  const baseW = template.canvas.width;
  const baseH = template.canvas.height;

  const outputCanvas = document.createElement('canvas');
  const targetWidth = shouldDuplicate ? baseW * 2 : baseW;
  const targetHeight = baseH;

  outputCanvas.width = targetWidth;
  outputCanvas.height = targetHeight;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) throw new Error('Cannot get 2d context for composite');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  const [overlayImg, ...photoImgs] = await Promise.all([
    loadImage(template.overlay),
    ...photos.map((p) => loadImage(p)),
  ]);

  const renderSingleStrip = (offsetX) => {
    template.slots.forEach((slot, index) => {
      const photoImg = photoImgs[index];
      if (photoImg) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(offsetX + slot.x, slot.y, slot.w, slot.h);
        ctx.clip();
        drawImageCover(ctx, photoImg, offsetX + slot.x, slot.y, slot.w, slot.h);
        ctx.restore();
      }
    });

    ctx.drawImage(overlayImg, offsetX, 0, baseW, baseH);

    if (printSessionId && sessionId) {
      ctx.save();
      ctx.font = '700 18px "Space Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      const text = `#${sessionId}`;
      const textMetrics = ctx.measureText(text);
      const tx = offsetX + baseW - textMetrics.width - 24;
      const ty = baseH - 24;
      ctx.strokeText(text, tx, ty);
      ctx.fillText(text, tx, ty);
      ctx.restore();
    }
  };

  if (shouldDuplicate) {
    renderSingleStrip(0);
    renderSingleStrip(baseW);

    ctx.save();
    ctx.setLineDash([12, 12]);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(baseW, 0);
    ctx.lineTo(baseW, targetHeight);
    ctx.stroke();
    ctx.restore();
  } else {
    renderSingleStrip(0);
  }

  return outputCanvas.toDataURL('image/jpeg', 0.95);
}
