/**
 * generateHeroCard.ts
 * Generates a standalone PNG Hero Card via the Canvas 2D API.
 * This bypasses html2canvas entirely, so Tailwind's `oklab` colors are not an issue.
 */

interface Stats {
  JIWA: number;
  RAGA: number;
  HARTA: number;
  ILMU: number;
  KARMA: number;
}

interface HeroCardOptions {
  name: string;
  level: number;
  xp: number;
  stats: Stats;
  personalityTitle?: string;
  streak?: number;
}

// Dimension colors (hex, not oklab)
const DIM_COLORS: Record<string, string> = {
  JIWA:  '#A855F7',
  RAGA:  '#22C55E',
  HARTA: '#F59E0B',
  ILMU:  '#3B82F6',
  KARMA: '#EC4899',
};

const DIM_LABELS: Record<string, string> = {
  JIWA:  'SPIRIT',
  RAGA:  'VITALITY',
  HARTA: 'FORTUNE',
  ILMU:  'WISDOM',
  KARMA: 'EMPATHY',
};

function hexToRgb(hex: string, alpha = 1): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  radius: number,
  stats: Stats
) {
  const dims = Object.keys(stats) as (keyof Stats)[];
  const n = dims.length;
  const angleStep = (Math.PI * 2) / n;
  const startAngle = -Math.PI / 2;

  // Draw spider web
  for (let ring = 1; ring <= 4; ring++) {
    const r = (ring / 4) * radius;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = startAngle + i * angleStep;
      const px = cx + Math.cos(angle) * r;
      const py = cy + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw spokes
  for (let i = 0; i < n; i++) {
    const angle = startAngle + i * angleStep;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Filled polygon
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const dim = dims[i];
    const val = stats[dim] / 100;
    const angle = startAngle + i * angleStep;
    const px = cx + Math.cos(angle) * radius * val;
    const py = cy + Math.sin(angle) * radius * val;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath();
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, 'rgba(168,85,247,0.5)');
  grad.addColorStop(1, 'rgba(59,130,246,0.2)');
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = '#A855F7';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dots & labels
  for (let i = 0; i < n; i++) {
    const dim = dims[i];
    const val = stats[dim] / 100;
    const angle = startAngle + i * angleStep;
    const px = cx + Math.cos(angle) * radius * val;
    const py = cy + Math.sin(angle) * radius * val;

    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fillStyle = DIM_COLORS[dim] ?? '#fff';
    ctx.fill();

    // Label at rim
    const lx = cx + Math.cos(angle) * (radius + 20);
    const ly = cy + Math.sin(angle) * (radius + 20);
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = DIM_COLORS[dim] ?? '#fff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(DIM_LABELS[dim], lx, ly);

    // Value
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`${stats[dim]}`, lx, ly + 13);
  }
}

export async function generateHeroCard(options: HeroCardOptions): Promise<Blob> {
  const { name, level, xp, stats, personalityTitle = 'The Unwritten Legend', streak = 0 } = options;

  const W = 540;
  const H = 960;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  // ── Background ──────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, '#0f0f14');
  bgGrad.addColorStop(1, '#09090d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle glow top-right
  const glow = ctx.createRadialGradient(W, 0, 0, W, 0, 400);
  glow.addColorStop(0, 'rgba(168,85,247,0.18)');
  glow.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // ── Border ──────────────────────────────────────────────────────────────────
  drawRoundedRect(ctx, 12, 12, W - 24, H - 24, 32);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // ── Top gradient line ────────────────────────────────────────────────────────
  const lineGrad = ctx.createLinearGradient(0, 12, W, 12);
  lineGrad.addColorStop(0,   'rgba(168,85,247,0)');
  lineGrad.addColorStop(0.5, 'rgba(168,85,247,0.8)');
  lineGrad.addColorStop(1,   'rgba(168,85,247,0)');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 12); ctx.lineTo(W - 40, 12);
  ctx.stroke();

  // ── ARUTHA watermark header ──────────────────────────────────────────────────
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = 'rgba(168,85,247,0.5)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText('— ARUTHA CHRONICLE —', W / 2, 28);

  // ── Avatar circle ────────────────────────────────────────────────────────────
  const avatarY = 70;
  const avatarR = 62;
  const avatarCX = W / 2;
  const avatarCY = avatarY + avatarR;

  const avatarGrad = ctx.createLinearGradient(avatarCX - avatarR, avatarCY - avatarR, avatarCX + avatarR, avatarCY + avatarR);
  avatarGrad.addColorStop(0, '#A855F7');
  avatarGrad.addColorStop(0.5, '#3B82F6');
  avatarGrad.addColorStop(1, '#22C55E');
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarR, 0, Math.PI * 2);
  ctx.fillStyle = avatarGrad;
  ctx.fill();

  // Initials
  ctx.font = `bold ${avatarR * 0.8}px sans-serif`;
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name.substring(0, 2).toUpperCase(), avatarCX, avatarCY);

  // Level badge
  const lvlBadgeY = avatarCY + avatarR - 16;
  drawRoundedRect(ctx, avatarCX - 28, lvlBadgeY, 56, 26, 8);
  ctx.fillStyle = '#A855F7';
  ctx.fill();
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`LVL ${level}`, avatarCX, lvlBadgeY + 13);

  // ── Name & Title ─────────────────────────────────────────────────────────────
  const nameY = avatarCY + avatarR + 24;
  ctx.font = `bold 36px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(name.toUpperCase(), W / 2, nameY);

  ctx.font = 'italic 14px sans-serif';
  ctx.fillStyle = '#A855F7';
  ctx.fillText(personalityTitle, W / 2, nameY + 44);

  // ── XP Bar ───────────────────────────────────────────────────────────────────
  const barY = nameY + 80;
  const barW = W - 80;
  const barX = 40;
  const barH = 8;
  const xpPct = Math.min(1, xp / (level * 1000));

  ctx.font = 'bold 10px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.textAlign = 'left';
  ctx.fillText('EXP', barX, barY - 14);
  ctx.textAlign = 'right';
  ctx.fillText(`${xp} / ${level * 1000}`, barX + barW, barY - 14);

  // Track
  drawRoundedRect(ctx, barX, barY, barW, barH, 4);
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.fill();

  // Fill
  const fillGrad = ctx.createLinearGradient(barX, 0, barX + barW, 0);
  fillGrad.addColorStop(0, '#A855F7');
  fillGrad.addColorStop(0.5, '#F59E0B');
  fillGrad.addColorStop(1, '#3B82F6');
  drawRoundedRect(ctx, barX, barY, Math.max(8, barW * xpPct), barH, 4);
  ctx.fillStyle = fillGrad;
  ctx.fill();

  // ── Streak Aura ──────────────────────────────────────────────────────────────
  if (streak >= 7) {
    const streakLabel = streak >= 30 ? `🔥 ${streak} Hari — 3× XP Aura` : streak >= 14 ? `⚡ ${streak} Hari — 2× XP Aura` : `✨ ${streak} Hari — 1.5× XP Aura`;
    const auraColor = streak >= 30 ? '#A855F7' : streak >= 14 ? '#3B82F6' : '#EF4444';
    const auraY = barY + 22;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = auraColor;
    ctx.fillText(streakLabel, W / 2, auraY);
  }

  // ── Radar Chart ──────────────────────────────────────────────────────────────
  const radarY = barY + (streak >= 7 ? 50 : 30);
  const radarCX = W / 2;
  const radarCY = radarY + 130;
  const radarR = 110;
  drawRadar(ctx, radarCX, radarCY, radarR, stats);

  // ── Stat bars ────────────────────────────────────────────────────────────────
  const statStartY = radarCY + radarR + 40;
  const dims = Object.keys(stats) as (keyof Stats)[];
  const bW = (W - 80 - 16 * (dims.length - 1)) / dims.length;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  dims.forEach((dim, i) => {
    const bX = 40 + i * (bW + 16);
    const val = stats[dim];
    const color = DIM_COLORS[dim];

    // Label
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(dim, bX + bW / 2, statStartY);

    // Bar track
    const bH = 60;
    drawRoundedRect(ctx, bX, statStartY + 14, bW, bH, 4);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();

    // Fill
    const fillH = Math.max(4, bH * (val / 100));
    drawRoundedRect(ctx, bX, statStartY + 14 + bH - fillH, bW, fillH, 4);
    ctx.fillStyle = hexToRgb(color, 0.8);
    ctx.fill();

    // Value
    ctx.font = 'bold 11px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${val}`, bX + bW / 2, statStartY + 14 + bH + 6);
  });

  // ── Footer ───────────────────────────────────────────────────────────────────
  const footerY = H - 48;
  const footerGrad = ctx.createLinearGradient(0, footerY, W, footerY);
  footerGrad.addColorStop(0, 'rgba(168,85,247,0)');
  footerGrad.addColorStop(0.5, 'rgba(168,85,247,0.3)');
  footerGrad.addColorStop(1, 'rgba(168,85,247,0)');
  ctx.fillStyle = footerGrad;
  ctx.fillRect(40, footerY, W - 80, 1);

  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('arutha.app — Your Legend, Visualized', W / 2, footerY + 20);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob) resolve(blob);
      else reject(new Error('Canvas toBlob returned null'));
    }, 'image/png');
  });
}
