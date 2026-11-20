// Neon Coast Cover Studio — render engine.
// Draws an original multi-panel poster cover from the user's photos, a grade
// and a caption. Everything is drawn on a 2D canvas at the exact export size,
// so text and panel edges stay sharp at 1080x1080, 1080x1350 and 1920x1080.
// No Rockstar logo, artwork or font is used anywhere: lettering is Anton
// (SIL OFL) and Pacifico (SIL OFL), titles are the user's own words.

export const LAYOUTS = {
  hero3: {
    label: 'Hero + 3',
    desc: 'One big hero photo over three small panels',
    panels(W, H) {
      const gap = Math.round(Math.min(W, H) * 0.008);
      const heroH = Math.round(H * 0.6);
      const smallH = H - heroH - gap;
      const smallW = Math.round((W - gap * 2) / 3);
      return [
        { x: 0, y: 0, w: W, h: heroH },
        { x: 0, y: heroH + gap, w: smallW, h: smallH },
        { x: smallW + gap, y: heroH + gap, w: smallW, h: smallH },
        { x: (smallW + gap) * 2, y: heroH + gap, w: W - (smallW + gap) * 2, h: smallH },
      ];
    },
  },
  diagonal: {
    label: 'Diagonal Cut',
    desc: 'Two photos split by a sharp diagonal slash',
    panels(W, H) {
      const top = 0.62; // diagonal meets the top edge at 62% across
      const bottom = 0.38; // and the bottom edge at 38% across
      return [
        { x: 0, y: 0, w: W, h: H, poly: [[0, 0], [W * top, 0], [W * bottom, H], [0, H]] },
        { x: 0, y: 0, w: W, h: H, poly: [[W * top, 0], [W, 0], [W, H], [W * bottom, H]] },
      ];
    },
  },
  strips3: {
    label: 'Triple Strip',
    desc: 'Three tall vertical strips, like a film roll',
    panels(W, H) {
      const gap = Math.round(Math.min(W, H) * 0.008);
      const w = Math.round((W - gap * 2) / 3);
      return [
        { x: 0, y: 0, w, h: H },
        { x: w + gap, y: 0, w, h: H },
        { x: (w + gap) * 2, y: 0, w: W - (w + gap) * 2, h: H },
      ];
    },
  },
  grid4: {
    label: 'Four Square',
    desc: 'A clean 2 x 2 grid of moments',
    panels(W, H) {
      const gap = Math.round(Math.min(W, H) * 0.008);
      const w = Math.round((W - gap) / 2);
      const h = Math.round((H - gap) / 2);
      return [
        { x: 0, y: 0, w, h },
        { x: w + gap, y: 0, w: W - w - gap, h },
        { x: 0, y: h + gap, w, h: H - h - gap },
        { x: w + gap, y: h + gap, w: W - w - gap, h: H - h - gap },
      ];
    },
  },
  fullbleed: {
    label: 'Full Bleed',
    desc: 'One photo edge to edge, title over the grade',
    panels(W, H) {
      return [{ x: 0, y: 0, w: W, h: H }];
    },
  },
  tilted: {
    label: 'Tilted Snaps',
    desc: 'Overlapping tilted snapshots on a coloured board',
    panels(W, H) {
      // A denser collage: hero top-left, a second snapshot top-right, a
      // third along the bottom — all clear of the title band (which starts
      // near 0.78H), so no face is ever cut by the band's edge. The bottom
      // snapshot is short and wide, so it is flagged faceBias: a centred
      // cover-fit crop of a portrait photo there would land on the neck
      // and chin, and drawPhotoInto anchors it toward the face instead.
      return [
        { x: Math.round(W * 0.03), y: Math.round(H * 0.03), w: Math.round(W * 0.62), h: Math.round(H * 0.6), rotate: -2.5 },
        { x: Math.round(W * 0.6), y: Math.round(H * 0.05), w: Math.round(W * 0.37), h: Math.round(H * 0.42), rotate: 2.5 },
        { x: Math.round(W * 0.3), y: Math.round(H * 0.55), w: Math.round(W * 0.4), h: Math.round(H * 0.22), rotate: -2, faceBias: true },
      ];
    },
  },
};

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    filter: 'saturate(1.32) contrast(1.07) brightness(1.03)',
    overlays: [
      { type: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(255,94,98,0.10)'], [0.55, 'rgba(255,154,0,0.10)'], [1, 'rgba(236,0,140,0.22)']], blend: 'soft-light' },
      { type: 'linear', x0: 0, y0: 0.55, x1: 0, y1: 1, stops: [[0, 'rgba(255,120,60,0)'], [1, 'rgba(120,10,80,0.34)']], blend: 'multiply' },
    ],
  },
  neon: {
    label: 'Neon Night',
    filter: 'saturate(1.45) contrast(1.14) brightness(0.92)',
    overlays: [
      { type: 'linear', x0: 0, y0: 0, x1: 1, y1: 1, stops: [[0, 'rgba(0,229,255,0.24)'], [0.5, 'rgba(120,0,255,0.16)'], [1, 'rgba(255,0,128,0.28)']], blend: 'overlay' },
      { type: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(10,10,40,0.12)'], [1, 'rgba(5,0,20,0.38)']], blend: 'multiply' },
    ],
  },
  golden: {
    label: 'Golden Hour',
    filter: 'saturate(1.22) contrast(1.05) brightness(1.06)',
    overlays: [
      { type: 'radial', x0: 0.5, y0: 0.32, r0: 0.1, r1: 0.9, stops: [[0, 'rgba(255,214,120,0.28)'], [1, 'rgba(255,140,0,0)']], blend: 'soft-light' },
      { type: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(255,190,80,0)'], [1, 'rgba(140,60,0,0.22)']], blend: 'multiply' },
    ],
  },
  teal: {
    label: 'Palm Teal',
    filter: 'saturate(1.18) contrast(1.06)',
    overlays: [
      { type: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(0,180,170,0.14)'], [1, 'rgba(0,60,70,0.26)']], blend: 'multiply' },
      { type: 'linear', x0: 0, y0: 0, x1: 1, y1: 0, stops: [[0, 'rgba(255,240,200,0.10)'], [1, 'rgba(255,240,200,0)']], blend: 'screen' },
    ],
  },
  noir: {
    label: 'Noir Mono',
    filter: 'grayscale(1) contrast(1.18) brightness(1.02)',
    overlays: [
      { type: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, stops: [[0, 'rgba(255,255,255,0.06)'], [1, 'rgba(0,0,0,0.28)']], blend: 'multiply' },
    ],
  },
  original: {
    label: 'Original',
    filter: 'none',
    overlays: [],
  },
};

export const TITLE_COLORS = {
  sunset: { label: 'Sunset', stops: ['#fff3b0', '#ff9a3d', '#ff2e88'], solid: null },
  white: { label: 'White', stops: null, solid: '#ffffff' },
  neon: { label: 'Neon Pink', stops: ['#ffe3f6', '#ff5ce1', '#7b2fff'], solid: null },
  gold: { label: 'Gold', stops: ['#fff8d6', '#ffd34d', '#c47f17'], solid: null },
  mint: { label: 'Mint', stops: ['#eafff8', '#5cf2c7', '#0aa98a'], solid: null },
};

export const TITLE_BLOCKS = {
  band: 'Halftone band',
  frame: 'White frame',
  clean: 'No block',
};

const BACKDROPS = {
  sunset: '#241024', neon: '#0b0620', golden: '#2b1a0e', teal: '#062a2a', noir: '#111111', original: '#1c1420',
};

// A small deterministic grain tile, generated once and reused.
let grainTile = null;
function getGrainTile() {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 160; t.height = 160;
  const c = t.getContext('2d');
  const img = c.createImageData(160, 160);
  let seed = 1337;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  c.putImageData(img, 0, 0);
  grainTile = t;
  return t;
}

function panelPath(ctx, p) {
  ctx.beginPath();
  if (p.poly) {
    ctx.moveTo(p.poly[0][0], p.poly[0][1]);
    for (let i = 1; i < p.poly.length; i++) ctx.lineTo(p.poly[i][0], p.poly[i][1]);
    ctx.closePath();
  } else {
    ctx.rect(p.x, p.y, p.w, p.h);
  }
}

// Draw one photo into a panel rect, cover-fit, with pan (fx, fy in -0.5..0.5
// of the overflow) and zoom. Returns false when there is no image.
// A panel flagged `faceBias` (the Tilted layout's short bottom snapshot)
// anchors portrait photos toward the top, where faces sit: that panel is
// short and wide, so a centred crop of a tall photo shows only a thin
// middle slice and cuts the sitter at the neck or chin. The user's fy is
// remapped around that upper anchor instead of around the centre — the
// remap is monotonic and keeps both extremes reachable (fy -0.5 still
// shows the very bottom of the photo, fy +0.5 the very top), so dragging,
// the zoom slider and the pan reset keep working exactly as before, just
// around a smarter neutral position. Landscape and square photos, and
// every unflagged panel, crop exactly as they always did.
function drawPhotoInto(ctx, img, p, fx, fy, zoom) {
  if (!img || !img.naturalWidth) return false;
  const pw = p.w; const ph = p.h;
  const base = Math.max(pw / img.naturalWidth, ph / img.naturalHeight) * zoom;
  const dw = img.naturalWidth * base;
  const dh = img.naturalHeight * base;
  let anchorY = fy;
  if (p.faceBias && img.naturalHeight > img.naturalWidth && dh > ph) {
    // The thinner the visible slice (the more of the photo the panel
    // hides), the stronger the pull toward the top — capped so a little
    // context below the face stays in frame.
    const hidden = 1 - ph / dh;
    const bias = Math.min(0.42, 0.22 + hidden * 0.3);
    anchorY = fy >= 0
      ? bias + (fy / 0.5) * (0.5 - bias)
      : bias + (fy / 0.5) * (bias + 0.5);
  }
  const ox = (pw - dw) / 2 + fx * Math.max(0, dw - pw);
  const oy = (ph - dh) / 2 + anchorY * Math.max(0, dh - ph);
  ctx.drawImage(img, p.x + ox, p.y + oy, dw, dh);
  return true;
}

function applyOverlays(ctx, grade, x, y, w, h) {
  for (const o of grade.overlays) {
    let g;
    if (o.type === 'linear') {
      g = ctx.createLinearGradient(x + o.x0 * w, y + o.y0 * h, x + o.x1 * w, y + o.y1 * h);
    } else {
      g = ctx.createRadialGradient(x + o.x0 * w, y + o.y0 * h, o.r0 * Math.max(w, h), x + o.x0 * w, y + o.y0 * h, o.r1 * Math.max(w, h));
    }
    for (const [stop, color] of o.stops) g.addColorStop(stop, color);
    ctx.save();
    ctx.globalCompositeOperation = o.blend;
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }
}

function drawHalftoneBand(ctx, x, y, w, h, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = 'rgba(0,0,0,0.16)';
  const step = Math.max(10, Math.round(h * 0.16));
  for (let yy = y + step / 2; yy < y + h; yy += step) {
    for (let xx = x + step / 2; xx < x + w; xx += step) {
      const r = step * 0.16 * (0.5 + 0.5 * ((yy - y) / h));
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// Fits the title on one line (shrinks until it fits) and draws it with an
// optional gradient fill, outline and soft shadow. Returns the font size used.
export function drawTitle(ctx, text, cx, baselineY, maxW, baseSize, colorKey, outline, shadow) {
  const clean = text.trim().toUpperCase();
  if (!clean) return 0;
  const color = TITLE_COLORS[colorKey] ?? TITLE_COLORS.sunset;
  let size = baseSize;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => { ctx.font = `${s}px Anton, 'Arial Narrow', sans-serif`; };
  setFont(size);
  while (ctx.measureText(clean).width > maxW && size > 14) {
    size -= 2;
    setFont(size);
  }
  if (shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.18;
    ctx.shadowOffsetY = size * 0.06;
  }
  if (color.stops) {
    const g = ctx.createLinearGradient(0, baselineY - size, 0, baselineY + size * 0.12);
    g.addColorStop(0, color.stops[0]);
    g.addColorStop(0.55, color.stops[1]);
    g.addColorStop(1, color.stops[2]);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = color.solid;
  }
  ctx.fillText(clean, cx, baselineY);
  if (outline) {
    ctx.lineWidth = Math.max(2, size * 0.045);
    ctx.strokeStyle = 'rgba(20,8,24,0.9)';
    ctx.lineJoin = 'round';
    ctx.strokeText(clean, cx, baselineY);
    // Re-fill so the stroke never eats the gradient's bright edge.
    ctx.fillText(clean, cx, baselineY);
  }
  if (shadow) ctx.restore();
  return size;
}

/** Draws the whole cover. `state` carries layout, grade, panels, caption and
 *  finish options; `photos` maps a photo id to an HTMLImageElement (or null).
 *  `W`, `H` are the exact output pixels. */
export function drawCover(canvas, state, photos, W, H) {
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  const layout = LAYOUTS[state.layout] ?? LAYOUTS.hero3;
  const grade = GRADES[state.grade] ?? GRADES.sunset;
  const panels = layout.panels(W, H);

  // Backdrop (shows through the gutters and behind tilted snapshots).
  ctx.fillStyle = BACKDROPS[state.grade] ?? '#1c1420';
  ctx.fillRect(0, 0, W, H);

  // Panels.
  const gap = Math.round(Math.min(W, H) * 0.008);
  for (let i = 0; i < panels.length; i++) {
    const p = panels[i];
    const slot = state.panels[i] ?? { photoId: null, fx: 0, fy: 0, zoom: 1 };
    const img = slot.photoId ? photos[slot.photoId] : null;
    ctx.save();
    if (p.rotate) {
      const cx = p.x + p.w / 2; const cy = p.y + p.h / 2;
      ctx.translate(cx, cy);
      ctx.rotate((p.rotate * Math.PI) / 180);
      ctx.translate(-cx, -cy);
      // Snapshot white border.
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(p.x - gap * 0.7, p.y - gap * 0.7, p.w + gap * 1.4, p.h + gap * 1.4);
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = Math.round(Math.min(W, H) * 0.03);
      ctx.shadowOffsetY = Math.round(Math.min(W, H) * 0.012);
    }
    panelPath(ctx, p);
    ctx.clip();
    if (img) {
      ctx.filter = grade.filter;
      drawPhotoInto(ctx, img, p, slot.fx ?? 0, slot.fy ?? 0, slot.zoom ?? 1);
      ctx.filter = 'none';
      applyOverlays(ctx, grade, p.x, p.y, p.w, p.h);
    } else {
      // Empty panel: a warm placeholder so the layout still reads.
      const g = ctx.createLinearGradient(p.x, p.y, p.x + p.w, p.y + p.h);
      g.addColorStop(0, '#3a1f3d'); g.addColorStop(1, '#1c0f22');
      ctx.fillStyle = g;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.font = `${Math.round(Math.min(p.w, p.h) * 0.07)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Drop a photo here', p.x + p.w / 2, p.y + p.h / 2);
    }
    ctx.restore();
    // Crisp white keyline around each panel (except the diagonal cut, where
    // the slash itself is the divider).
    if (!p.poly && !p.rotate) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = Math.max(2, Math.round(Math.min(W, H) * 0.004));
      ctx.strokeRect(p.x, p.y, p.w, p.h);
      ctx.restore();
    }
  }
  // Diagonal slash divider.
  if (state.layout === 'diagonal') {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(3, Math.round(Math.min(W, H) * 0.006));
    ctx.beginPath();
    ctx.moveTo(W * 0.62, 0);
    ctx.lineTo(W * 0.38, H);
    ctx.stroke();
    ctx.restore();
  }

  // ---- Caption block ----
  const title = (state.title ?? '').trim();
  const subtitle = (state.subtitle ?? '').trim();
  const pos = state.titlePos ?? 'bottom';
  const block = state.titleBlock ?? 'band';
  const sizeScale = state.titleSize ?? 1;
  const baseTitle = Math.round(H * 0.115 * sizeScale);
  const bandH = Math.round(baseTitle * 1.9);
  const bandY = pos === 'top' ? 0 : H - bandH;

  if (title || subtitle) {
    if (block === 'band') {
      drawHalftoneBand(ctx, 0, bandY, W, bandH, 'rgba(16,6,20,0.82)');
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.fillRect(0, bandY, W, Math.max(2, Math.round(H * 0.004)));
      ctx.fillRect(0, bandY + bandH - Math.max(2, Math.round(H * 0.004)), W, Math.max(2, Math.round(H * 0.004)));
    } else if (block === 'frame') {
      const m = Math.round(Math.min(W, H) * 0.03);
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = Math.max(3, Math.round(Math.min(W, H) * 0.006));
      ctx.strokeRect(m, m, W - m * 2, H - m * 2);
      ctx.restore();
    }
    const cx = W / 2;
    const maxW = W * (block === 'frame' ? 0.86 : 0.92);
    if (title) {
      const baseline = pos === 'top'
        ? bandY + bandH * 0.62
        : bandY + bandH * 0.62;
      const used = drawTitle(ctx, title, cx, baseline, maxW, baseTitle, state.titleColor ?? 'sunset', state.outline !== false, state.shadow !== false);
      if (subtitle) {
        const subSize = Math.max(18, Math.round(used * 0.34));
        ctx.save();
        ctx.font = `${subSize}px Pacifico, cursive`;
        ctx.textAlign = 'center';
        ctx.fillStyle = state.subtitleColor ?? '#ffd9ec';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = subSize * 0.25;
        ctx.fillText(subtitle, cx, baseline + subSize * 1.55);
        ctx.restore();
      }
    } else if (subtitle) {
      const subSize = Math.max(20, Math.round(baseTitle * 0.42));
      ctx.save();
      ctx.font = `${subSize}px Pacifico, cursive`;
      ctx.textAlign = 'center';
      ctx.fillStyle = state.subtitleColor ?? '#ffd9ec';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = subSize * 0.25;
      ctx.fillText(subtitle, cx, bandY + bandH * 0.6);
      ctx.restore();
    }
  }

  // ---- Finish: vignette + grain ----
  if (state.vignette !== false) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.grain !== false) {
    const tile = getGrainTile();
    const pat = ctx.createPattern(tile, 'repeat');
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return { panels, layout: state.layout };
}
