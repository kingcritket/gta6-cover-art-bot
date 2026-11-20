// cover.js — mesin gambar untuk Neon Coast Cover Studio.
//
// Semua lukisan terjadi di atas kanvas 2D pada ukuran piksel ekspor yang
// persis diminta pemanggil. Modul ini murni: tidak menyentuh DOM selain
// kanvas yang diberikan, tidak memuat apa pun dari jaringan, dan hasil
// untuk masukan yang sama selalu identik (butir grain memakai LCG
// berbenih tetap, bukan Math.random).

// ---------------------------------------------------------------------------
// Tata letak panel
// ---------------------------------------------------------------------------

function gutter(W, H) {
  return Math.round(Math.min(W, H) * 0.008);
}

export const LAYOUTS = {
  hero3: {
    label: 'Hero + 3',
    desc: 'One wide hero shot on top, three small frames underneath.',
    panels(W, H) {
      const gap = gutter(W, H);
      const heroH = Math.round(0.6 * H);
      const smallH = H - heroH - gap;
      const smallW = Math.round((W - 2 * gap) / 3);
      const y = heroH + gap;
      return [
        { x: 0, y: 0, w: W, h: heroH },
        { x: 0, y, w: smallW, h: smallH },
        { x: smallW + gap, y, w: smallW, h: smallH },
        { x: 2 * (smallW + gap), y, w: W - 2 * (smallW + gap), h: smallH },
      ];
    },
  },
  diagonal: {
    label: 'Diagonal Cut',
    desc: 'Two frames split by a bold diagonal slash.',
    panels(W, H) {
      const topX = Math.round(0.62 * W);
      const botX = Math.round(0.38 * W);
      return [
        { points: [[0, 0], [topX, 0], [botX, H], [0, H]] },
        { points: [[topX, 0], [W, 0], [W, H], [botX, H]] },
      ];
    },
  },
  strips3: {
    label: 'Triple Strip',
    desc: 'Three tall vertical strips side by side.',
    panels(W, H) {
      const gap = gutter(W, H);
      const w = Math.round((W - 2 * gap) / 3);
      return [
        { x: 0, y: 0, w, h: H },
        { x: w + gap, y: 0, w, h: H },
        { x: 2 * (w + gap), y: 0, w: W - 2 * (w + gap), h: H },
      ];
    },
  },
  grid4: {
    label: 'Four Square',
    desc: 'A tidy two-by-two grid of equal frames.',
    panels(W, H) {
      const gap = gutter(W, H);
      const cw = Math.round((W - gap) / 2);
      const ch = Math.round((H - gap) / 2);
      return [
        { x: 0, y: 0, w: cw, h: ch },
        { x: cw + gap, y: 0, w: W - cw - gap, h: ch },
        { x: 0, y: ch + gap, w: cw, h: H - ch - gap },
        { x: cw + gap, y: ch + gap, w: W - cw - gap, h: H - ch - gap },
      ];
    },
  },
  fullbleed: {
    label: 'Full Bleed',
    desc: 'A single photograph filling the whole cover.',
    panels(W, H) {
      return [{ x: 0, y: 0, w: W, h: H }];
    },
  },
  tilted: {
    label: 'Tilted Snaps',
    desc: 'Three snapshots tossed onto a coloured board.',
    panels(W, H) {
      const r = Math.round;
      return [
        { x: r(0.03 * W), y: r(0.03 * H), w: r(0.62 * W), h: r(0.60 * H), rotate: -2.5 },
        { x: r(0.60 * W), y: r(0.05 * H), w: r(0.37 * W), h: r(0.42 * H), rotate: 2.5 },
        { x: r(0.30 * W), y: r(0.55 * H), w: r(0.40 * W), h: r(0.22 * H), rotate: -2, faceBias: true },
      ];
    },
  },
};

// ---------------------------------------------------------------------------
// Grade warna
// ---------------------------------------------------------------------------

export const GRADES = {
  sunset: {
    label: 'Vice Sunset',
    backdrop: '#241024',
    filter: 'saturate(1.32) contrast(1.07) brightness(1.03)',
    overlays: [
      {
        kind: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, blend: 'soft-light',
        stops: [[0, 'rgba(255,94,98,0.10)'], [0.55, 'rgba(255,154,0,0.10)'], [1, 'rgba(236,0,140,0.22)']],
      },
      {
        kind: 'linear', x0: 0, y0: 0.55, x1: 0, y1: 1, blend: 'multiply',
        stops: [[0, 'rgba(255,120,60,0)'], [1, 'rgba(120,10,80,0.34)']],
      },
    ],
  },
  neon: {
    label: 'Neon Night',
    backdrop: '#0b0620',
    filter: 'saturate(1.45) contrast(1.14) brightness(0.92)',
    overlays: [
      {
        kind: 'linear', x0: 0, y0: 0, x1: 1, y1: 1, blend: 'overlay',
        stops: [[0, 'rgba(0,229,255,0.24)'], [0.5, 'rgba(120,0,255,0.16)'], [1, 'rgba(255,0,128,0.28)']],
      },
      {
        kind: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, blend: 'multiply',
        stops: [[0, 'rgba(10,10,40,0.12)'], [1, 'rgba(5,0,20,0.38)']],
      },
    ],
  },
  golden: {
    label: 'Golden Hour',
    backdrop: '#2b1a0e',
    filter: 'saturate(1.22) contrast(1.05) brightness(1.06)',
    overlays: [
      {
        kind: 'radial', cx: 0.5, cy: 0.32, r0: 0.1, r1: 0.9, blend: 'soft-light',
        stops: [[0, 'rgba(255,214,120,0.28)'], [1, 'rgba(255,140,0,0)']],
      },
      {
        kind: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, blend: 'multiply',
        stops: [[0, 'rgba(255,190,80,0)'], [1, 'rgba(140,60,0,0.22)']],
      },
    ],
  },
  teal: {
    label: 'Palm Teal',
    backdrop: '#062a2a',
    filter: 'saturate(1.18) contrast(1.06)',
    overlays: [
      {
        kind: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, blend: 'multiply',
        stops: [[0, 'rgba(0,180,170,0.14)'], [1, 'rgba(0,60,70,0.26)']],
      },
      {
        // Sorotan hangat yang memudar dari kiri ke kanan.
        kind: 'linear', x0: 0, y0: 0, x1: 1, y1: 0, blend: 'screen',
        stops: [[0, 'rgba(255,240,200,0.10)'], [1, 'rgba(255,240,200,0)']],
      },
    ],
  },
  noir: {
    label: 'Noir Mono',
    backdrop: '#111111',
    filter: 'grayscale(1) contrast(1.18) brightness(1.02)',
    overlays: [
      {
        kind: 'linear', x0: 0, y0: 0, x1: 0, y1: 1, blend: 'multiply',
        stops: [[0, 'rgba(255,255,255,0.06)'], [1, 'rgba(0,0,0,0.28)']],
      },
    ],
  },
  original: {
    label: 'Original',
    backdrop: '#1c1420',
    filter: 'none',
    overlays: [],
  },
};

// ---------------------------------------------------------------------------
// Warna judul dan blok keterangan
// ---------------------------------------------------------------------------

export const TITLE_COLORS = {
  sunset: { label: 'Sunset', stops: ['#fff3b0', '#ff9a3d', '#ff2e88'] },
  white: { label: 'White', solid: '#ffffff' },
  neon: { label: 'Neon Pink', stops: ['#ffe3f6', '#ff5ce1', '#7b2fff'] },
  gold: { label: 'Gold', stops: ['#fff8d6', '#ffd34d', '#c47f17'] },
  mint: { label: 'Mint', stops: ['#eafff8', '#5cf2c7', '#0aa98a'] },
};

export const TITLE_BLOCKS = {
  band: { label: 'Halftone band' },
  frame: { label: 'White frame' },
  clean: { label: 'No block' },
};

// ---------------------------------------------------------------------------
// Membantu: jalur panel, foto cover-fit, overlay grade
// ---------------------------------------------------------------------------

function tracePanelPath(ctx, panel) {
  ctx.beginPath();
  if (panel.points) {
    panel.points.forEach(([px, py], i) => {
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.closePath();
  } else {
    ctx.rect(panel.x, panel.y, panel.w, panel.h);
  }
}

function panelBox(panel) {
  // Kotak pembatas untuk panel poligon; panel persegi memakai kotaknya sendiri.
  if (!panel.points) return panel;
  const xs = panel.points.map((p) => p[0]);
  const ys = panel.points.map((p) => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

// Menghitung persegi tujuan foto di dalam panel memakai aturan cover-fit.
// fx/fy adalah geseran pengguna dalam rentang [-0.5, 0.5].
//
// Perbaikan face-bias: panel sempit ber-flag faceBias (snapshot bawah pada
// layout tilted) memotong foto potret secara brutal bila jangkar vertikal
// ditengah-tengahkan — wajah di sepertiga atas foto hilang di luar bingkai.
// Untuk kasus itu jangkar digeser ke atas sebanding dengan seberapa banyak
// foto yang tersembunyi, sambil tetap memetakan ujung-ujung geseran
// pengguna ke ujung-ujung rentang yang bisa dicapai, jadi kontrol pan
// tidak kehilangan jangkauannya.
function photoRect(panel, panelState, img) {
  const pw = panel.w;
  const ph = panel.h;
  const nw = img.naturalWidth || img.width;
  const nh = img.naturalHeight || img.height;
  const zoom = panelState.zoom || 1;
  const fx = panelState.fx || 0;
  const fy = panelState.fy || 0;
  const scale = Math.max(pw / nw, ph / nh) * zoom;
  const dw = nw * scale;
  const dh = nh * scale;

  let anchorY = fy;
  if (panel.faceBias && nh > nw && dh > ph) {
    const hidden = 1 - ph / dh;
    const bias = Math.min(0.42, 0.22 + hidden * 0.3);
    if (fy >= 0) {
      anchorY = bias + (fy / 0.5) * (0.5 - bias);
    } else {
      anchorY = bias + (fy / 0.5) * (bias + 0.5);
    }
  }

  const ox = (pw - dw) / 2 + fx * Math.max(0, dw - pw);
  const oy = (ph - dh) / 2 + anchorY * Math.max(0, dh - ph);
  return { dx: panel.x + ox, dy: panel.y + oy, dw, dh };
}

function paintGradeOverlays(ctx, grade, box) {
  for (const ov of grade.overlays) {
    let grad;
    if (ov.kind === 'radial') {
      const big = Math.max(box.w, box.h);
      grad = ctx.createRadialGradient(
        box.x + ov.cx * box.w, box.y + ov.cy * box.h, ov.r0 * big,
        box.x + ov.cx * box.w, box.y + ov.cy * box.h, ov.r1 * big,
      );
    } else {
      grad = ctx.createLinearGradient(
        box.x + ov.x0 * box.w, box.y + ov.y0 * box.h,
        box.x + ov.x1 * box.w, box.y + ov.y1 * box.h,
      );
    }
    for (const [at, colour] of ov.stops) grad.addColorStop(at, colour);
    ctx.save();
    ctx.globalCompositeOperation = ov.blend;
    ctx.fillStyle = grad;
    ctx.fillRect(box.x, box.y, box.w, box.h);
    ctx.restore();
  }
}

function paintEmptyPanel(ctx, box) {
  const grad = ctx.createLinearGradient(box.x, box.y, box.x + box.w, box.y + box.h);
  grad.addColorStop(0, '#3a1f3d');
  grad.addColorStop(1, '#1c0f22');
  ctx.fillStyle = grad;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = `${Math.round(0.07 * Math.min(box.w, box.h))}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Drop a photo here', box.x + box.w / 2, box.y + box.h / 2);
}

function paintPanel(ctx, panel, panelState, img, grade, W, H) {
  const gap = gutter(W, H);
  const rotated = typeof panel.rotate === 'number' && panel.rotate !== 0;
  const box = panelBox(panel);

  ctx.save();
  if (rotated) {
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((panel.rotate * Math.PI) / 180);
    ctx.translate(-cx, -cy);
    // Bingkai snapshot putih plus bayangan lembut, digambar sebelum kliping
    // supaya tepi kertasnya terlihat mengelilingi foto.
    const pad = 0.7 * gap;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 0.03 * Math.min(W, H);
    ctx.shadowOffsetY = 0.012 * Math.min(W, H);
    ctx.fillStyle = '#fdfbf7';
    ctx.fillRect(panel.x - pad, panel.y - pad, panel.w + 2 * pad, panel.h + 2 * pad);
    ctx.restore();
  }

  tracePanelPath(ctx, panel);
  ctx.clip();

  if (img) {
    const r = photoRect(panel, panelState, img);
    ctx.save();
    ctx.filter = grade.filter;
    ctx.drawImage(img, r.dx, r.dy, r.dw, r.dh);
    ctx.restore();
    paintGradeOverlays(ctx, grade, box);
  } else {
    paintEmptyPanel(ctx, box);
  }
  ctx.restore();

  // Garis kunci putih yang tegas di sekeliling panel persegi biasa.
  if (!panel.points && !rotated) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(2, Math.round(0.004 * Math.min(W, H)));
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Blok keterangan: pita halftone / bingkai putih / bersih, judul, subjudul
// ---------------------------------------------------------------------------

export function drawTitle(ctx, state, W, H) {
  const title = (state.title || '').trim();
  const subtitle = (state.subtitle || '').trim();
  if (!title && !subtitle) return;

  const baseTitle = Math.round(H * 0.115 * (state.titleSize || 1));
  const bandH = Math.round(baseTitle * 1.9);
  const bandY = state.titlePos === 'top' ? 0 : H - bandH;
  const block = state.titleBlock || 'band';

  if (block === 'band') {
    ctx.save();
    ctx.fillStyle = 'rgba(16,6,20,0.82)';
    ctx.fillRect(0, bandY, W, bandH);
    // Titik-titik halftone yang membesar ke arah bawah pita.
    const step = Math.max(10, Math.round(bandH * 0.16));
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    for (let y = bandY + step / 2; y < bandY + bandH; y += step) {
      const grow = 0.5 + 0.5 * ((y - bandY) / bandH);
      const rad = step * 0.16 * grow;
      for (let x = step / 2; x < W; x += step) {
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    const hair = Math.max(2, Math.round(0.004 * H));
    ctx.fillRect(0, bandY, W, hair);
    ctx.fillRect(0, bandY + bandH - hair, W, hair);
    ctx.restore();
  } else if (block === 'frame') {
    ctx.save();
    const m = Math.round(0.03 * Math.min(W, H));
    ctx.strokeStyle = 'rgba(255,255,255,0.92)';
    ctx.lineWidth = Math.max(3, Math.round(0.006 * Math.min(W, H)));
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    ctx.restore();
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  let usedTitle = 0;
  let baseline = bandY + 0.62 * bandH;

  if (title) {
    const maxW = W * (block === 'frame' ? 0.86 : 0.92);
    let size = baseTitle;
    ctx.font = `${size}px Anton, sans-serif`;
    while (size > 14 && ctx.measureText(title.toUpperCase()).width > maxW) {
      size -= 2;
      ctx.font = `${size}px Anton, sans-serif`;
    }
    usedTitle = size;

    const palette = TITLE_COLORS[state.titleColor] || TITLE_COLORS.sunset;
    let fill = palette.solid || '#ffffff';
    if (palette.stops) {
      const grad = ctx.createLinearGradient(0, baseline - size, 0, baseline + 0.12 * size);
      grad.addColorStop(0, palette.stops[0]);
      grad.addColorStop(0.5, palette.stops[1]);
      grad.addColorStop(1, palette.stops[2]);
      fill = grad;
    }

    if (state.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.55)';
      ctx.shadowBlur = 0.18 * size;
      ctx.shadowOffsetY = 0.06 * size;
    }
    ctx.fillStyle = fill;
    const text = title.toUpperCase();
    if (state.outline) {
      ctx.save();
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(20,8,24,0.9)';
      ctx.lineWidth = Math.max(2, 0.045 * size);
      ctx.lineJoin = 'round';
      ctx.strokeText(text, W / 2, baseline);
      ctx.restore();
      // Isi ulang di atas goresan supaya tepi gradiennya tidak termakan.
      ctx.fillStyle = fill;
      ctx.fillText(text, W / 2, baseline);
    } else {
      ctx.fillText(text, W / 2, baseline);
    }
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
  }

  if (subtitle) {
    ctx.save();
    ctx.fillStyle = state.subtitleColor || '#ffd9ec';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    if (title) {
      const subSize = Math.max(18, Math.round(0.34 * usedTitle));
      ctx.font = `${subSize}px Pacifico, cursive`;
      ctx.shadowBlur = 0.25 * subSize;
      ctx.fillText(subtitle, W / 2, baseline + 1.55 * subSize);
    } else {
      const subSize = Math.max(20, Math.round(0.42 * baseTitle));
      ctx.font = `${subSize}px Pacifico, cursive`;
      ctx.shadowBlur = 0.25 * subSize;
      ctx.fillText(subtitle, W / 2, bandY + 0.6 * bandH);
    }
    ctx.restore();
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Sentuhan akhir: vignette dan grain
// ---------------------------------------------------------------------------

let grainTile = null;

function buildGrainTile() {
  const tile = document.createElement('canvas');
  tile.width = 160;
  tile.height = 160;
  const tctx = tile.getContext('2d');
  const data = tctx.createImageData(160, 160);
  let seed = 1337;
  for (let i = 0; i < data.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const grey = Math.floor((seed / 2147483647) * 256);
    data.data[i] = grey;
    data.data[i + 1] = grey;
    data.data[i + 2] = grey;
    data.data[i + 3] = 255;
  }
  tctx.putImageData(data, 0, 0);
  return tile;
}

function paintFinish(ctx, state, W, H) {
  if (state.vignette !== false) {
    const grad = ctx.createRadialGradient(
      W / 2, H / 2, 0.42 * Math.min(W, H),
      W / 2, H / 2, 0.75 * Math.max(W, H),
    );
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.save();
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (state.grain !== false) {
    if (!grainTile) grainTile = buildGrainTile();
    ctx.save();
    ctx.globalAlpha = 0.07;
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = ctx.createPattern(grainTile, 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Pintu masuk utama
// ---------------------------------------------------------------------------

export function drawCover(canvas, state, photos, W, H) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  const layout = LAYOUTS[state.layout] || LAYOUTS.hero3;
  const grade = GRADES[state.grade] || GRADES.sunset;
  const panels = layout.panels(W, H);

  // Warna latar grade mengisi seluruh kanvas: inilah yang terlihat di
  // sela-sela antar panel dan di papan di belakang snapshot miring.
  ctx.fillStyle = grade.backdrop;
  ctx.fillRect(0, 0, W, H);

  panels.forEach((panel, i) => {
    const panelState = (state.panels && state.panels[i]) || { photoId: null, fx: 0, fy: 0, zoom: 1 };
    const img = panelState.photoId ? photos[panelState.photoId] : null;
    paintPanel(ctx, panel, panelState, img || null, grade, W, H);
  });

  if (state.layout === 'diagonal') {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(3, Math.round(0.006 * Math.min(W, H)));
    ctx.beginPath();
    ctx.moveTo(Math.round(0.62 * W), 0);
    ctx.lineTo(Math.round(0.38 * W), H);
    ctx.stroke();
    ctx.restore();
  }

  drawTitle(ctx, state, W, H);
  paintFinish(ctx, state, W, H);

  return { panels, layout };
}
