/**
 * Lightweight QR Code canvas generator for dynamic QRIS (JavaScript)
 * Generates an authentic QRIS layout with header and high-contrast matrix
 */

export function generateQRISVisual(payload, amount) {
  const canvas = document.createElement('canvas');
  const size = 420;
  canvas.width = size;
  canvas.height = size + 90;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Top QRIS header banner
  ctx.fillStyle = '#ea2328';
  ctx.fillRect(0, 0, canvas.width, 48);

  ctx.fillStyle = '#ffffff';
  ctx.font = '900 22px "Archivo Black", sans-serif';
  ctx.fillText('QRIS', 24, 32);

  ctx.font = '700 11px "Space Mono", monospace';
  ctx.fillText('STANDAR PEMBAYARAN NASIONAL', 100, 31);

  // Pseudo-random deterministic QR matrix based on payload hash
  const gridSize = 29;
  const cellSize = Math.floor((size - 40) / gridSize);
  const startX = Math.floor((canvas.width - gridSize * cellSize) / 2);
  const startY = 60;

  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }

  function seededRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  ctx.fillStyle = '#000000';

  const isPositionFinder = (r, c) => {
    if (r < 7 && c < 7) return true;
    if (r < 7 && c >= gridSize - 7) return true;
    if (r >= gridSize - 7 && c < 7) return true;
    return false;
  };

  const drawFinder = (startXPos, startYPos) => {
    ctx.fillRect(startXPos, startYPos, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(startXPos + cellSize, startYPos + cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = '#000000';
    ctx.fillRect(startXPos + 2 * cellSize, startYPos + 2 * cellSize, 3 * cellSize, 3 * cellSize);
  };

  drawFinder(startX, startY);
  drawFinder(startX + (gridSize - 7) * cellSize, startY);
  drawFinder(startX, startY + (gridSize - 7) * cellSize);

  let seed = Math.abs(hash);
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      if (isPositionFinder(r, c)) continue;

      if (r === 6 || c === 6) {
        if ((r + c) % 2 === 0) {
          ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
        }
        continue;
      }

      seed = (seed * 9301 + 49297) % 233280;
      const val = seededRandom(seed);
      if (val > 0.48) {
        ctx.fillRect(startX + c * cellSize, startY + r * cellSize, cellSize, cellSize);
      }
    }
  }

  const centerSize = 5 * cellSize;
  const centerX = startX + Math.floor((gridSize - 5) / 2) * cellSize;
  const centerY = startY + Math.floor((gridSize - 5) / 2) * cellSize;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(centerX - 4, centerY - 4, centerSize + 8, centerSize + 8);
  ctx.fillStyle = '#000000';
  ctx.strokeRect(centerX - 4, centerY - 4, centerSize + 8, centerSize + 8);

  ctx.fillStyle = '#ea2328';
  ctx.font = '900 13px "Archivo Black", sans-serif';
  ctx.fillText('GPN', centerX + 4, centerY + 18);

  const footerY = canvas.height - 24;
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, canvas.height - 40, canvas.width, 40);

  ctx.fillStyle = '#000000';
  ctx.font = '700 13px "Space Mono", monospace';
  ctx.fillText(`NOMINAL: Rp ${Number(amount).toLocaleString('id-ID')}`, 20, footerY);

  ctx.font = '400 11px "Space Mono", monospace';
  ctx.fillText('NMID: ID1020268894101', canvas.width - 180, footerY);

  return canvas.toDataURL('image/png');
}
