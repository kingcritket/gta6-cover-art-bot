// main.js — pengkabelan editor Neon Coast Cover Studio.
//
// Menghubungkan kontrol di index.html ke mesin gambar di cover.js:
// pratinjau langsung, baki foto, geser/zoom per panel, riwayat undo/redo,
// dan ekspor PNG pada ukuran penuh. Semua foto tetap di perangkat —
// foto pengguna hanya dibaca sebagai object URL lokal.

import { drawCover, LAYOUTS, GRADES, TITLE_COLORS, TITLE_BLOCKS } from './cover.js';
import { runShot } from './shots.js';

const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

const PANEL_COUNTS = { hero3: 4, diagonal: 2, strips3: 3, grid4: 4, fullbleed: 1, tilted: 3 };

function defaultPanels(layout, photoIds) {
  const count = PANEL_COUNTS[layout] || 1;
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push({
      photoId: photoIds.length ? photoIds[i % photoIds.length] : null,
      fx: 0,
      // Sedikit bias ke atas: wajah biasanya duduk di paruh atas foto.
      fy: i === 0 ? 0.3 : 0.12,
      zoom: 1,
    });
  }
  return out;
}

let state = {
  layout: 'hero3',
  grade: 'sunset',
  size: 'square',
  title: 'Sunset Heist',
  subtitle: 'a Vice Coast story',
  titleColor: 'sunset',
  subtitleColor: '#ffd9ec',
  titleSize: 1,
  titlePos: 'bottom',
  titleBlock: 'band',
  outline: true,
  shadow: true,
  grain: true,
  vignette: true,
  selected: 0,
  panels: defaultPanels('hero3', ['pier', 'boulevard']),
};

// Foto yang dikenal editor: id -> { id, name, img }
const photos = {};
const photoOrder = [];
let userPhotoSeq = 0;

// ---------------------------------------------------------------------------
// Riwayat undo/redo berbasis snapshot JSON
// ---------------------------------------------------------------------------

const past = [];
const future = [];
let pendingSnap = null;

function snap() {
  return JSON.stringify(state);
}

function beginHistory() {
  pendingSnap = snap();
}

function commitHistory() {
  if (pendingSnap !== null && pendingSnap !== snap()) {
    past.push(pendingSnap);
    if (past.length > 60) past.shift();
    future.length = 0;
  }
  pendingSnap = null;
  syncUndoButtons();
}

function applySnapshot(json) {
  state = JSON.parse(json);
  if (state.selected >= state.panels.length) state.selected = state.panels.length - 1;
  syncControls();
  redraw();
}

function undo() {
  if (!past.length) return;
  future.push(snap());
  applySnapshot(past.pop());
  syncUndoButtons();
}

function redo() {
  if (!future.length) return;
  past.push(snap());
  applySnapshot(future.pop());
  syncUndoButtons();
}

function syncUndoButtons() {
  el.undo.disabled = past.length === 0;
  el.redo.disabled = future.length === 0;
}

// ---------------------------------------------------------------------------
// Referensi elemen
// ---------------------------------------------------------------------------

const el = {};
function grab(id) {
  el[id] = document.getElementById(id);
  return el[id];
}

const canvas = () => el.cover;

// ---------------------------------------------------------------------------
// Gambar pratinjau + garis pilih panel
// ---------------------------------------------------------------------------

let lastPanels = [];

function redraw() {
  const size = SIZES[state.size];
  const fullRes = document.body.classList.contains('shot-cover');
  const scale = fullRes ? 1 : Math.min(1, 760 / Math.max(size.w, size.h));
  const W = Math.round(size.w * scale);
  const H = Math.round(size.h * scale);
  const result = drawCover(canvas(), state, imagesMap(), W, H);
  lastPanels = result.panels;
  paintSelection(W, H);
  el.panelLabel.textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
}

function imagesMap() {
  const map = {};
  for (const id of photoOrder) map[id] = photos[id].img;
  return map;
}

function paintSelection(W, H) {
  const panel = lastPanels[state.selected];
  if (!panel) return;
  const ctx = canvas().getContext('2d');
  ctx.save();
  ctx.strokeStyle = '#ffd34d';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  if (panel.points) {
    ctx.beginPath();
    panel.points.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
    ctx.closePath();
    ctx.stroke();
  } else if (panel.rotate) {
    const cx = panel.x + panel.w / 2;
    const cy = panel.y + panel.h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((panel.rotate * Math.PI) / 180);
    ctx.strokeRect(-panel.w / 2, -panel.h / 2, panel.w, panel.h);
  } else {
    ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Membangun grup tombol opsi dari peta yang diekspor cover.js
// ---------------------------------------------------------------------------

function buildOptionGroup(container, entries, get, onPick) {
  container.innerHTML = '';
  for (const [key, def] of entries) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'opt';
    btn.textContent = def.label;
    btn.title = def.desc || def.label;
    btn.dataset.key = key;
    btn.addEventListener('click', () => {
      if (get() === key) return;
      beginHistory();
      onPick(key);
      commitHistory();
      syncControls();
      redraw();
    });
    container.appendChild(btn);
  }
}

function syncOptionGroup(container, current) {
  for (const btn of container.children) {
    btn.classList.toggle('active', btn.dataset.key === current);
  }
}

function currentPhotoIds() {
  const ids = state.panels.map((p) => p.photoId).filter(Boolean);
  return ids.length ? ids : ['pier', 'boulevard'];
}

function setLayout(key) {
  const ids = currentPhotoIds();
  state.layout = key;
  state.panels = defaultPanels(key, ids);
  state.selected = 0;
}

function buildUI() {
  buildOptionGroup(el.layoutOpts, Object.entries(LAYOUTS), () => state.layout, setLayout);
  buildOptionGroup(el.gradeOpts, Object.entries(GRADES), () => state.grade, (k) => { state.grade = k; });
  buildOptionGroup(el.colorOpts, Object.entries(TITLE_COLORS), () => state.titleColor, (k) => { state.titleColor = k; });

  const sizeSel = el.sizeSelect;
  sizeSel.innerHTML = '';
  for (const [key, s] of Object.entries(SIZES)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = s.label;
    sizeSel.appendChild(opt);
  }
  const blockSel = el.blockSelect;
  blockSel.innerHTML = '';
  for (const [key, def] of Object.entries(TITLE_BLOCKS)) {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = def.label;
    blockSel.appendChild(opt);
  }
}

function syncControls() {
  syncOptionGroup(el.layoutOpts, state.layout);
  syncOptionGroup(el.gradeOpts, state.grade);
  syncOptionGroup(el.colorOpts, state.titleColor);
  el.titleInput.value = state.title;
  el.subtitleInput.value = state.subtitle;
  el.titleSize.value = Math.round(state.titleSize * 100);
  el.titleSizeVal.textContent = `${Math.round(state.titleSize * 100)}%`;
  el.posSelect.value = state.titlePos;
  el.blockSelect.value = state.titleBlock;
  el.outlineChk.checked = state.outline;
  el.shadowChk.checked = state.shadow;
  el.grainChk.checked = state.grain;
  el.vignetteChk.checked = state.vignette;
  el.sizeSelect.value = state.size;
  const panel = state.panels[state.selected];
  if (panel) {
    el.zoom.value = Math.round(panel.zoom * 100);
    el.zoomVal.textContent = `${Math.round(panel.zoom * 100)}%`;
  }
  syncUndoButtons();
}

// ---------------------------------------------------------------------------
// Baki foto
// ---------------------------------------------------------------------------

function renderTray() {
  el.tray.innerHTML = '';
  for (const id of photoOrder) {
    const entry = photos[id];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'thumb';
    if (state.panels[state.selected] && state.panels[state.selected].photoId === id) {
      btn.classList.add('active');
    }
    const img = document.createElement('img');
    img.src = entry.img.src;
    img.alt = entry.name;
    const cap = document.createElement('span');
    cap.textContent = entry.name;
    btn.appendChild(img);
    btn.appendChild(cap);
    btn.addEventListener('click', () => assignPhoto(id));
    el.tray.appendChild(btn);
  }
}

function assignPhoto(id) {
  beginHistory();
  const panel = state.panels[state.selected];
  panel.photoId = id;
  panel.fx = 0;
  panel.fy = 0;
  panel.zoom = 1;
  commitHistory();
  syncControls();
  renderTray();
  redraw();
  setStatus(`Photo placed in panel ${state.selected + 1}.`);
}

function addUserPhoto(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    const id = `user${++userPhotoSeq}`;
    const base = file.name.replace(/\.[^.]+$/, '').slice(0, 18) || 'Photo';
    photos[id] = { id, name: base, img };
    photoOrder.push(id);
    renderTray();
    assignPhoto(id);
  };
  img.src = url;
}

function loadSample(id, name, src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      photos[id] = { id, name, img };
      if (!photoOrder.includes(id)) photoOrder.push(id);
      resolve();
    };
    img.onerror = () => resolve();
    img.src = src;
  });
}

// ---------------------------------------------------------------------------
// Interaksi kanvas: pilih, geser, zoom roda tetikus
// ---------------------------------------------------------------------------

function canvasPoint(evt) {
  const rect = canvas().getBoundingClientRect();
  const sx = canvas().width / rect.width;
  const sy = canvas().height / rect.height;
  return { x: (evt.clientX - rect.left) * sx, y: (evt.clientY - rect.top) * sy };
}

function pointInPolygon(x, y, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const [xi, yi] = points[i];
    const [xj, yj] = points[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function hitPanel(x, y) {
  for (let i = lastPanels.length - 1; i >= 0; i--) {
    const p = lastPanels[i];
    if (p.points) {
      if (pointInPolygon(x, y, p.points)) return i;
    } else if (p.rotate) {
      const cx = p.x + p.w / 2;
      const cy = p.y + p.h / 2;
      const rad = (-p.rotate * Math.PI) / 180;
      const dx = x - cx;
      const dy = y - cy;
      const lx = cx + dx * Math.cos(rad) - dy * Math.sin(rad);
      const ly = cy + dx * Math.sin(rad) + dy * Math.cos(rad);
      if (lx >= p.x && lx <= p.x + p.w && ly >= p.y && ly <= p.y + p.h) return i;
    } else if (x >= p.x && x <= p.x + p.w && y >= p.y && y <= p.y + p.h) {
      return i;
    }
  }
  return -1;
}

let drag = null;

function bindCanvas() {
  const c = canvas();
  c.addEventListener('pointerdown', (evt) => {
    const pt = canvasPoint(evt);
    const hit = hitPanel(pt.x, pt.y);
    if (hit >= 0 && hit !== state.selected) {
      state.selected = hit;
      syncControls();
      renderTray();
      redraw();
    }
    drag = { x: pt.x, y: pt.y, moved: false };
    beginHistory();
    c.setPointerCapture(evt.pointerId);
    c.classList.add('grabbing');
  });
  c.addEventListener('pointermove', (evt) => {
    if (!drag) return;
    const pt = canvasPoint(evt);
    const dx = pt.x - drag.x;
    const dy = pt.y - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
    if (!drag.moved) return;
    const panel = state.panels[state.selected];
    const geom = lastPanels[state.selected];
    if (panel && geom && !geom.points) {
      panel.fx = clamp(panel.fx + (dx / geom.w) * 0.6, -0.5, 0.5);
      panel.fy = clamp(panel.fy + (dy / geom.h) * 0.6, -0.5, 0.5);
    } else if (panel && geom && geom.points) {
      panel.fx = clamp(panel.fx + (dx / c.width) * 0.6, -0.5, 0.5);
      panel.fy = clamp(panel.fy + (dy / c.height) * 0.6, -0.5, 0.5);
    }
    drag.x = pt.x;
    drag.y = pt.y;
    redraw();
  });
  const endDrag = () => {
    if (!drag) return;
    if (drag.moved) commitHistory();
    else pendingSnap = null;
    drag = null;
    c.classList.remove('grabbing');
  };
  c.addEventListener('pointerup', endDrag);
  c.addEventListener('pointercancel', endDrag);
  c.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    const panel = state.panels[state.selected];
    if (!panel) return;
    beginHistory();
    panel.zoom = clamp(panel.zoom * (evt.deltaY < 0 ? 1.08 : 0.92), 1, 3);
    commitHistory();
    syncControls();
    redraw();
  }, { passive: false });
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

// ---------------------------------------------------------------------------
// Ekspor
// ---------------------------------------------------------------------------

function setStatus(msg) {
  el.status.textContent = msg;
}

function exportSize(sizeKey) {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  drawCover(off, state, imagesMap(), size.w, size.h);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${size.w}x${size.h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    setStatus(`Exported neon-coast-cover-${size.w}x${size.h}.png`);
  }, 'image/png');
}

// Kait uji: menggambar ukuran ekspor di luar layar dan melaporkan ukurannya.
window.__exportProbe = (sizeKey) => {
  const size = SIZES[sizeKey];
  const off = document.createElement('canvas');
  drawCover(off, state, imagesMap(), size.w, size.h);
  return { w: off.width, h: off.height, title: state.title };
};

// ---------------------------------------------------------------------------
// Pengkabelan kontrol
// ---------------------------------------------------------------------------

function bindControls() {
  el.prevPanel.addEventListener('click', () => {
    state.selected = (state.selected - 1 + state.panels.length) % state.panels.length;
    syncControls(); renderTray(); redraw();
  });
  el.nextPanel.addEventListener('click', () => {
    state.selected = (state.selected + 1) % state.panels.length;
    syncControls(); renderTray(); redraw();
  });

  el.zoom.addEventListener('input', () => {
    const panel = state.panels[state.selected];
    panel.zoom = Number(el.zoom.value) / 100;
    el.zoomVal.textContent = `${el.zoom.value}%`;
    redraw();
  });
  el.zoom.addEventListener('focus', beginHistory);
  el.zoom.addEventListener('change', commitHistory);

  el.resetPan.addEventListener('click', () => {
    beginHistory();
    const panel = state.panels[state.selected];
    panel.fx = 0; panel.fy = 0; panel.zoom = 1;
    commitHistory();
    syncControls(); redraw();
  });

  for (const [input, key] of [[el.titleInput, 'title'], [el.subtitleInput, 'subtitle']]) {
    input.addEventListener('input', () => { state[key] = input.value; redraw(); });
    input.addEventListener('focus', beginHistory);
    input.addEventListener('change', commitHistory);
  }

  el.titleSize.addEventListener('input', () => {
    state.titleSize = Number(el.titleSize.value) / 100;
    el.titleSizeVal.textContent = `${el.titleSize.value}%`;
    redraw();
  });
  el.titleSize.addEventListener('focus', beginHistory);
  el.titleSize.addEventListener('change', commitHistory);

  el.posSelect.addEventListener('change', () => {
    beginHistory(); state.titlePos = el.posSelect.value; commitHistory(); redraw();
  });
  el.blockSelect.addEventListener('change', () => {
    beginHistory(); state.titleBlock = el.blockSelect.value; commitHistory(); redraw();
  });

  for (const [chk, key] of [[el.outlineChk, 'outline'], [el.shadowChk, 'shadow'], [el.grainChk, 'grain'], [el.vignetteChk, 'vignette']]) {
    chk.addEventListener('change', () => {
      beginHistory(); state[key] = chk.checked; commitHistory(); redraw();
    });
  }

  el.sizeSelect.addEventListener('change', () => {
    beginHistory(); state.size = el.sizeSelect.value; commitHistory(); redraw();
  });

  el.exportOne.addEventListener('click', () => exportSize(state.size));
  el.exportAll.addEventListener('click', () => {
    Object.keys(SIZES).forEach((key, i) => setTimeout(() => exportSize(key), i * 350));
  });

  el.surprise.addEventListener('click', () => {
    beginHistory();
    const layoutKeys = Object.keys(LAYOUTS);
    const gradeKeys = Object.keys(GRADES);
    const colorKeys = Object.keys(TITLE_COLORS);
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    setLayout(pick(layoutKeys));
    state.grade = pick(gradeKeys);
    state.titleColor = pick(colorKeys);
    commitHistory();
    syncControls(); renderTray(); redraw();
    setStatus('Surprise mix applied — photos kept.');
  });

  el.undo.addEventListener('click', undo);
  el.redo.addEventListener('click', redo);
  document.addEventListener('keydown', (evt) => {
    const mod = evt.ctrlKey || evt.metaKey;
    if (!mod) return;
    const k = evt.key.toLowerCase();
    if (k === 'z' && !evt.shiftKey) { evt.preventDefault(); undo(); }
    else if ((k === 'z' && evt.shiftKey) || k === 'y') { evt.preventDefault(); redo(); }
  });

  el.photo.addEventListener('change', () => {
    for (const file of el.photo.files) addUserPhoto(file);
    el.photo.value = '';
  });

  const stage = document.querySelector('.stage');
  stage.addEventListener('dragover', (evt) => { evt.preventDefault(); stage.classList.add('dropping'); });
  stage.addEventListener('dragleave', () => stage.classList.remove('dropping'));
  stage.addEventListener('drop', (evt) => {
    evt.preventDefault();
    stage.classList.remove('dropping');
    for (const file of evt.dataTransfer.files) {
      if (file.type.startsWith('image/')) addUserPhoto(file);
    }
  });
}

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function boot() {
  ['cover', 'tray', 'photo', 'layoutOpts', 'gradeOpts', 'colorOpts', 'prevPanel', 'nextPanel',
   'panelLabel', 'zoom', 'zoomVal', 'resetPan', 'titleInput', 'subtitleInput', 'titleSize',
   'titleSizeVal', 'posSelect', 'blockSelect', 'outlineChk', 'shadowChk', 'grainChk',
   'vignetteChk', 'sizeSelect', 'exportOne', 'exportAll', 'surprise', 'undo', 'redo', 'status',
  ].forEach(grab);

  buildUI();
  bindControls();
  bindCanvas();
  syncControls();

  await Promise.all([
    loadSample('pier', 'Pier', './samples/pier.jpg'),
    loadSample('boulevard', 'Boulevard', './samples/boulevard.jpg'),
  ]);
  renderTray();
  redraw();

  const query = new URLSearchParams(location.search);
  const shot = query.get('shot');
  if (shot) {
    await runShot(shot, query, async ({ photo, caption, layout, grade, size }) => {
      if (layout && LAYOUTS[layout]) setLayout(layout);
      if (grade && GRADES[grade]) state.grade = grade;
      if (size) {
        const m = /^(\d+)x(\d+)$/.exec(size);
        if (m) {
          const found = Object.entries(SIZES).find(([, s]) => s.w === Number(m[1]) && s.h === Number(m[2]));
          if (found) state.size = found[0];
        }
      }
      const other = photo === 'pier' ? 'boulevard' : 'pier';
      state.panels.forEach((panel, i) => {
        panel.photoId = state.layout === 'diagonal' && i === 1 ? other : photo;
      });
      state.title = caption;
      state.selected = 0;
      syncControls();
      renderTray();
      redraw();
    });
  }
}

boot();
