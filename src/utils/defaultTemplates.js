/**
 * Generates default Brutalist photobooth templates (JavaScript)
 */

function createBrutalistOverlay(width, height, slots, options) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = options.bgColor;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  slots.forEach((s) => {
    ctx.fillRect(s.x, s.y, s.w, s.h);
  });
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = options.textColor;
  ctx.lineWidth = 8;
  slots.forEach((s) => {
    ctx.strokeRect(s.x - 4, s.y - 4, s.w + 8, s.h + 8);

    const markLen = 18;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(s.x - 12, s.y - 4);
    ctx.lineTo(s.x + markLen, s.y - 4);
    ctx.moveTo(s.x - 4, s.y - 12);
    ctx.lineTo(s.x - 4, s.y + markLen);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(s.x + s.w - markLen, s.y + s.h + 4);
    ctx.lineTo(s.x + s.w + 12, s.y + s.h + 4);
    ctx.moveTo(s.x + s.w + 4, s.y + s.h - markLen);
    ctx.lineTo(s.x + s.w + 4, s.y + s.h + 12);
    ctx.stroke();
  });
  ctx.restore();

  ctx.save();
  ctx.fillStyle = options.textColor;

  ctx.font = '900 36px "Archivo Black", sans-serif';
  ctx.fillText(options.title.toUpperCase(), 48, 52);

  ctx.font = '700 16px "Space Mono", monospace';
  ctx.fillText(options.subtitle.toUpperCase(), 48, 76);

  const footerY = height - 60;
  ctx.font = '900 24px "Archivo Black", sans-serif';
  ctx.fillText('PHOTOBOOTH MVP', 48, footerY);

  ctx.font = '700 14px "Space Mono", monospace';
  ctx.fillText(options.dateStamp || 'EST. 2026 // RAWBLOCK EDITION', 48, footerY + 24);

  if (options.hasBarcode) {
    const bcX = width - 180;
    const bcY = height - 70;
    const bcW = 140;
    const bcH = 40;
    let curX = bcX;
    while (curX < bcX + bcW) {
      const lineW = Math.random() > 0.5 ? 4 : 2;
      const gap = Math.floor(Math.random() * 4) + 2;
      ctx.fillRect(curX, bcY, lineW, bcH);
      curX += lineW + gap;
    }
  }

  ctx.font = '700 14px "Space Mono", monospace';
  ctx.fillText(`[ ${options.paperType} ]`, width - 160, 52);

  ctx.restore();

  return canvas.toDataURL('image/png');
}

export function generateDefaultTemplates() {
  const strip4Slots = [
    { x: 50, y: 100, w: 500, h: 360 },
    { x: 50, y: 490, w: 500, h: 360 },
    { x: 50, y: 880, w: 500, h: 360 },
    { x: 50, y: 1270, w: 500, h: 360 },
  ];
  const strip4Overlay = createBrutalistOverlay(600, 1800, strip4Slots, {
    title: 'STUDIO STRIP',
    subtitle: 'FOUR SHOTS MEMORY // 2x6 IN',
    bgColor: '#ffffff',
    textColor: '#000000',
    paperType: '2x6 IN',
    hasBarcode: true,
  });

  const strip3Slots = [
    { x: 50, y: 120, w: 500, h: 460 },
    { x: 50, y: 620, w: 500, h: 460 },
    { x: 50, y: 1120, w: 500, h: 460 },
  ];
  const strip3Overlay = createBrutalistOverlay(600, 1800, strip3Slots, {
    title: 'NOIR TRIO',
    subtitle: 'TRIPLE FRAME BRUTAL // 2x6 IN',
    bgColor: '#000000',
    textColor: '#ffffff',
    paperType: '2x6 IN',
    hasBarcode: true,
  });

  const grid4Slots = [
    { x: 80, y: 140, w: 500, h: 680 },
    { x: 620, y: 140, w: 500, h: 680 },
    { x: 80, y: 860, w: 500, h: 680 },
    { x: 620, y: 860, w: 500, h: 680 },
  ];
  const grid4Overlay = createBrutalistOverlay(1200, 1800, grid4Slots, {
    title: 'POSTCARD 4R',
    subtitle: 'QUAD FRAME ARCHIVE // 4x6 IN (1200x1800 300DPI)',
    bgColor: '#ffffff',
    textColor: '#000000',
    paperType: '4R (4x6 IN)',
    hasBarcode: true,
  });

  const duoSlots = [
    { x: 100, y: 160, w: 1000, h: 680 },
    { x: 100, y: 900, w: 1000, h: 680 },
  ];
  const duoOverlay = createBrutalistOverlay(1200, 1800, duoSlots, {
    title: 'DUET MINIMAL',
    subtitle: 'TWIN HORIZONTAL FRAMES // 4x6 IN',
    bgColor: '#ffffff',
    textColor: '#000000',
    paperType: '4R (4x6 IN)',
    hasBarcode: true,
  });

  return [
    {
      id: 'strip-4',
      nama: 'Classic Strip (4 Foto)',
      overlay: strip4Overlay,
      canvas: { width: 600, height: 1800 },
      paper: '2x6in',
      slots: strip4Slots.map((s, idx) => ({ id: `slot-${idx + 1}`, order: idx + 1, ...s })),
      aktif: true,
    },
    {
      id: 'strip-3-noir',
      nama: 'Noir Trio Strip (3 Foto)',
      overlay: strip3Overlay,
      canvas: { width: 600, height: 1800 },
      paper: '2x6in',
      slots: strip3Slots.map((s, idx) => ({ id: `slot-${idx + 1}`, order: idx + 1, ...s })),
      aktif: true,
    },
    {
      id: 'grid-4-postcard',
      nama: 'Grid 4R Postcard (4 Foto)',
      overlay: grid4Overlay,
      canvas: { width: 1200, height: 1800 },
      paper: '4x6in',
      slots: grid4Slots.map((s, idx) => ({ id: `slot-${idx + 1}`, order: idx + 1, ...s })),
      aktif: true,
    },
    {
      id: 'duo-minimal',
      nama: 'Duet Minimal 4R (2 Foto)',
      overlay: duoOverlay,
      canvas: { width: 1200, height: 1800 },
      paper: '4x6in',
      slots: duoSlots.map((s, idx) => ({ id: `slot-${idx + 1}`, order: idx + 1, ...s })),
      aktif: true,
    },
  ];
}
