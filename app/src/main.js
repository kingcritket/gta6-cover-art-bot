// Neon Coast Cover Studio — UI wiring, state, undo/redo, export.
// Offline: the only images are the user's files and the bundled samples.
import { drawCover, LAYOUTS, GRADES, TITLE_COLORS, TITLE_BLOCKS } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const statusEl = $('status');

const SIZES = {
  square: { label: 'Square · 1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: 'Portrait · 1080 × 1350', w: 1080, h: 1350 },
  wide: { label: 'Wide · 1920 × 1080', w: 1920, h: 1080 },
};

// ---- State ---------------------------------------------------------------
function defaultPanels(layout, photoIds) {
  const count = { hero3: 4, diagonal: 2, strips3: 3, grid4: 4, fullbleed: 1, tilted: 3 }[layout] ?? 4;
  const panels = [];
  for (let i = 0; i < count; i++) {
    // Slight upward bias: faces usually sit in a photo's upper half, so the
    // default crop shows more of the top than the exact centre does.
    panels.push({ photoId: photoIds[i % photoIds.length] ?? null, fx: 0, fy: i === 0 ? 0.3 : 0.12, zoom: 1 });
  }
  return panels;
}

function defaultState() {
  return {
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
}

let state = defaultState();
const photos = {}; // id -> HTMLImageElement
const photoNames = {}; // id -> display name
let photoSeq = 0;

// ---- History (undo / redo) ----------------------------------------------
const history = { past: [], future: [] };
function snapshot() {
  return JSON.stringify({ ...state, panels: state.panels });
}
function pushHistory() {
  history.past.push(snapshot());
  if (history.past.length > 60) history.past.shift();
  history.future.length = 0;
  syncUndoButtons();
}
function restore(json) {
  const s = JSON.parse(json);
  state = s;
  syncControls();
  redraw();
}
function undo() {
  if (!history.past.length) return;
  history.future.push(snapshot());
  restore(history.past.pop());
  syncUndoButtons();
}
function redo() {
  if (!history.future.length) return;
  history.past.push(snapshot());
  restore(history.future.pop());
  syncUndoButtons();
}
function syncUndoButtons() {
  $('undo').disabled = !history.past.length;
  $('redo').disabled = !history.future.length;
}

// ---- Rendering ------------------------------------------------------------
function currentSize() {
  return SIZES[state.size] ?? SIZES.square;
}
function redraw() {
  const { w, h } = currentSize();
  // In a cover shot the canvas renders at full export resolution.
  const shotCover = document.body.classList.contains('shot-cover');
  const previewScale = shotCover ? 1 : Math.min(1, 760 / Math.max(w, h));
  canvas.width = Math.round(w * previewScale);
  canvas.height = Math.round(h * previewScale);
  // drawCover sets canvas.width/height itself; render at preview resolution.
  drawCover(canvas, state, photos, canvas.width, canvas.height);
  if (!shotCover) drawSelection();
  $('panelLabel').textContent = `Panel ${state.selected + 1} of ${state.panels.length}`;
}

function drawSelection() {
  // A dashed outline around the selected panel, drawn on the preview canvas.
  const { w, h } = currentSize();
  const sx = canvas.width / w; const sy = canvas.height / h;
  const layout = LAYOUTS[state.layout];
  const panels = layout.panels(w, h);
  const p = panels[state.selected];
  if (!p) return;
  const ctx = canvas.getContext('2d');
  ctx.save();
  ctx.setLineDash([10, 8]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#ffd34d';
  if (p.rotate) {
    const cx = (p.x + p.w / 2) * sx; const cy = (p.y + p.h / 2) * sy;
    ctx.translate(cx, cy);
    ctx.rotate((p.rotate * Math.PI) / 180);
    ctx.strokeRect((-p.w / 2) * sx, (-p.h / 2) * sy, p.w * sx, p.h * sy);
  } else if (p.poly) {
    ctx.beginPath();
    ctx.moveTo(p.poly[0][0] * sx, p.poly[0][1] * sy);
    for (let i = 1; i < p.poly.length; i++) ctx.lineTo(p.poly[i][0] * sx, p.poly[i][1] * sy);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.strokeRect(p.x * sx, p.y * sy, p.w * sx, p.h * sy);
  }
  ctx.restore();
}

// ---- Images ---------------------------------------------------------------
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

async function addPhotoFile(file) {
  const id = `up${++photoSeq}`;
  const img = await loadImage(URL.createObjectURL(file));
  photos[id] = img;
  photoNames[id] = file.name.replace(/\.[^.]+$/, '').slice(0, 18) || id;
  addTrayThumb(id);
  // Put the new photo into the selected panel.
  pushHistory();
  state.panels[state.selected].photoId = id;
  state.panels[state.selected].fx = 0;
  state.panels[state.selected].fy = 0;
  state.panels[state.selected].zoom = 1;
  syncControls();
  redraw();
  setStatus(`Added ${photoNames[id]} to panel ${state.selected + 1}`);
  return id;
}

function addTrayThumb(id) {
  const tray = $('tray');
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'thumb';
  b.dataset.id = id;
  b.title = photoNames[id] ?? id;
  const img = document.createElement('img');
  img.src = photos[id].src;
  img.alt = photoNames[id] ?? id;
  b.appendChild(img);
  const span = document.createElement('span');
  span.textContent = photoNames[id] ?? id;
  b.appendChild(span);
  b.addEventListener('click', () => {
    pushHistory();
    state.panels[state.selected].photoId = id;
    state.panels[state.selected].fx = 0;
    state.panels[state.selected].fy = 0;
    state.panels[state.selected].zoom = 1;
    syncTray();
    syncControls();
    redraw();
  });
  tray.appendChild(b);
  syncTray();
}

function syncTray() {
  const sel = state.panels[state.selected]?.photoId;
  for (const b of document.querySelectorAll('#tray .thumb')) {
    b.classList.toggle('active', b.dataset.id === sel);
  }
}

// ---- Controls -------------------------------------------------------------
function buildOptionButtons(containerId, entries, current, onPick) {
  const box = $(containerId);
  box.innerHTML = '';
  for (const [key, entry] of entries) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'opt' + (key === current ? ' active' : '');
    b.dataset.key = key;
    b.textContent = entry.label ?? entry;
    if (entry.desc) b.title = entry.desc;
    b.addEventListener('click', () => {
      pushHistory();
      onPick(key);
      for (const o of box.querySelectorAll('.opt')) o.classList.toggle('active', o.dataset.key === key);
      redraw();
    });
    box.appendChild(b);
  }
}

function syncControls() {
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('titleSize').value = Math.round(state.titleSize * 100);
  $('titleSizeVal').textContent = `${Math.round(state.titleSize * 100)}%`;
  $('zoom').value = Math.round((state.panels[state.selected]?.zoom ?? 1) * 100);
  $('zoomVal').textContent = `${Math.round((state.panels[state.selected]?.zoom ?? 1) * 100)}%`;
  $('posSelect').value = state.titlePos;
  $('blockSelect').value = state.titleBlock;
  $('outlineChk').checked = state.outline;
  $('shadowChk').checked = state.shadow;
  $('grainChk').checked = state.grain;
  $('vignetteChk').checked = state.vignette;
  $('sizeSelect').value = state.size;
  for (const [id, entries, cur] of [
    ['layoutOpts', Object.entries(LAYOUTS), state.layout],
    ['gradeOpts', Object.entries(GRADES), state.grade],
    ['colorOpts', Object.entries(TITLE_COLORS), state.titleColor],
  ]) {
    for (const o of $(id).querySelectorAll('.opt')) o.classList.toggle('active', o.dataset.key === cur);
  }
  syncTray();
  syncUndoButtons();
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// ---- Export ---------------------------------------------------------------
function exportPNG(sizeKey) {
  const { w, h } = SIZES[sizeKey];
  const off = document.createElement('canvas');
  drawCover(off, state, photos, w, h);
  off.toBlob((blob) => {
    if (!blob) { setStatus('Export failed — try again.'); return; }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-coast-cover-${w}x${h}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    setStatus(`Saved neon-coast-cover-${w}x${h}.png`);
  }, 'image/png');
}

// Test hook used by headless checks: renders one size and reports its pixels.
window.__exportProbe = (sizeKey) => {
  const { w, h } = SIZES[sizeKey];
  const off = document.createElement('canvas');
  drawCover(off, state, photos, w, h);
  return { w: off.width, h: off.height, title: state.title };
};

// ---- Panel interaction: click to select, drag to pan, wheel to zoom -------
function canvasPoint(e) {
  const r = canvas.getBoundingClientRect();
  const { w, h } = currentSize();
  return { x: ((e.clientX - r.left) / r.width) * w, y: ((e.clientY - r.top) / r.height) * h };
}
function hitPanel(pt) {
  const { w, h } = currentSize();
  const panels = LAYOUTS[state.layout].panels(w, h);
  for (let i = panels.length - 1; i >= 0; i--) {
    const p = panels[i];
    if (p.poly) {
      // Point-in-polygon for the diagonal cut.
      let inside = false;
      for (let a = 0, b = p.poly.length - 1; a < p.poly.length; b = a++) {
        const [ax, ay] = p.poly[a]; const [bx, by] = p.poly[b];
        if ((ay > pt.y) !== (by > pt.y) && pt.x < ((bx - ax) * (pt.y - ay)) / (by - ay) + ax) inside = !inside;
      }
      if (inside) return i;
    } else if (pt.x >= p.x && pt.x <= p.x + p.w && pt.y >= p.y && pt.y <= p.y + p.h) {
      return i;
    }
  }
  return -1;
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const pt = canvasPoint(e);
  const i = hitPanel(pt);
  if (i < 0) return;
  canvas.setPointerCapture(e.pointerId);
  if (i !== state.selected) {
    state.selected = i;
    syncControls();
    redraw();
  }
  drag = { x: e.clientX, y: e.clientY, fx: state.panels[i].fx, fy: state.panels[i].fy, moved: false };
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const slot = state.panels[state.selected];
  const r = canvas.getBoundingClientRect();
  const dx = (e.clientX - drag.x) / r.width;
  const dy = (e.clientY - drag.y) / r.height;
  if (Math.abs(dx) + Math.abs(dy) > 0.005) drag.moved = true;
  slot.fx = Math.max(-0.5, Math.min(0.5, drag.fx - dx * 0.6));
  slot.fy = Math.max(-0.5, Math.min(0.5, drag.fy - dy * 0.6));
  redraw();
});
canvas.addEventListener('pointerup', () => {
  if (drag?.moved) pushHistory();
  drag = null;
});
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const slot = state.panels[state.selected];
  const next = Math.max(1, Math.min(3, slot.zoom * (e.deltaY < 0 ? 1.08 : 0.92)));
  if (next !== slot.zoom) {
    slot.zoom = next;
    syncControls();
    redraw();
  }
}, { passive: false });

// ---- Wire up --------------------------------------------------------------
function initUI() {
  buildOptionButtons('layoutOpts', Object.entries(LAYOUTS), state.layout, (key) => {
    const keep = state.panels.map((p) => p.photoId);
    state.layout = key;
    state.panels = defaultPanels(key, keep);
    state.selected = 0;
    syncControls();
  });
  buildOptionButtons('gradeOpts', Object.entries(GRADES), state.grade, (key) => { state.grade = key; });
  buildOptionButtons('colorOpts', Object.entries(TITLE_COLORS), state.titleColor, (key) => { state.titleColor = key; });

  $('photo').addEventListener('change', async (e) => {
    for (const f of e.target.files) {
      try { await addPhotoFile(f); } catch { setStatus('Could not read that file.'); }
    }
    e.target.value = '';
  });
  const drop = $('stage');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('dropping'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('dropping'));
  drop.addEventListener('drop', async (e) => {
    e.preventDefault();
    drop.classList.remove('dropping');
    for (const f of e.dataTransfer.files) {
      if (f.type.startsWith('image/')) {
        try { await addPhotoFile(f); } catch { setStatus('Could not read that file.'); }
      }
    }
  });

  $('titleInput').addEventListener('input', (e) => { state.title = e.target.value; redraw(); });
  $('titleInput').addEventListener('change', pushHistory);
  $('subtitleInput').addEventListener('input', (e) => { state.subtitle = e.target.value; redraw(); });
  $('subtitleInput').addEventListener('change', pushHistory);
  $('titleSize').addEventListener('input', (e) => {
    state.titleSize = Number(e.target.value) / 100;
    $('titleSizeVal').textContent = `${e.target.value}%`;
    redraw();
  });
  $('titleSize').addEventListener('change', pushHistory);
  $('zoom').addEventListener('input', (e) => {
    state.panels[state.selected].zoom = Number(e.target.value) / 100;
    $('zoomVal').textContent = `${e.target.value}%`;
    redraw();
  });
  $('zoom').addEventListener('change', pushHistory);
  $('posSelect').addEventListener('change', (e) => { pushHistory(); state.titlePos = e.target.value; redraw(); });
  $('blockSelect').addEventListener('change', (e) => { pushHistory(); state.titleBlock = e.target.value; redraw(); });
  $('outlineChk').addEventListener('change', (e) => { pushHistory(); state.outline = e.target.checked; redraw(); });
  $('shadowChk').addEventListener('change', (e) => { pushHistory(); state.shadow = e.target.checked; redraw(); });
  $('grainChk').addEventListener('change', (e) => { pushHistory(); state.grain = e.target.checked; redraw(); });
  $('vignetteChk').addEventListener('change', (e) => { pushHistory(); state.vignette = e.target.checked; redraw(); });
  $('sizeSelect').addEventListener('change', (e) => { pushHistory(); state.size = e.target.value; redraw(); });

  $('prevPanel').addEventListener('click', () => {
    state.selected = (state.selected - 1 + state.panels.length) % state.panels.length;
    syncControls(); redraw();
  });
  $('nextPanel').addEventListener('click', () => {
    state.selected = (state.selected + 1) % state.panels.length;
    syncControls(); redraw();
  });
  $('resetPan').addEventListener('click', () => {
    pushHistory();
    const s = state.panels[state.selected];
    s.fx = 0; s.fy = 0; s.zoom = 1;
    syncControls(); redraw();
  });
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
    else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
  });

  $('surprise').addEventListener('click', () => {
    pushHistory();
    const layouts = Object.keys(LAYOUTS);
    const grades = Object.keys(GRADES);
    const colors = Object.keys(TITLE_COLORS);
    state.layout = layouts[Math.floor(Math.random() * layouts.length)];
    state.grade = grades[Math.floor(Math.random() * grades.length)];
    state.titleColor = colors[Math.floor(Math.random() * colors.length)];
    const keep = state.panels.map((p) => p.photoId);
    state.panels = defaultPanels(state.layout, keep);
    state.selected = 0;
    syncControls();
    redraw();
    setStatus('Surprise look applied — undo brings it back.');
  });

  $('exportOne').addEventListener('click', () => exportPNG(state.size));
  $('exportAll').addEventListener('click', () => {
    const keys = Object.keys(SIZES);
    keys.forEach((k, i) => setTimeout(() => exportPNG(k), i * 350));
    setStatus('Exporting all three sizes…');
  });
}

// ---- Boot -----------------------------------------------------------------
async function boot() {
  initUI();
  // Bundled samples (free to use, made for make.fun).
  for (const id of ['pier', 'boulevard']) {
    try {
      photos[id] = await loadImage(`samples/${id}.jpg`);
      photoNames[id] = id === 'pier' ? 'Pier' : 'Boulevard';
      addTrayThumb(id);
    } catch { /* sample missing: the tray stays usable with uploads */ }
  }
  syncControls();

  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) {
    await runShot(shot, params, async ({ photo, caption, layout, grade, size }) => {
      if (layout && LAYOUTS[layout]) {
        const keep = state.panels.map((p) => p.photoId);
        state.layout = layout;
        state.panels = defaultPanels(layout, keep);
        state.selected = 0;
      }
      if (grade && GRADES[grade]) state.grade = grade;
      if (size && /^\d+x\d+$/.test(size)) {
        const [w, h] = size.split('x').map(Number);
        const key = Object.keys(SIZES).find((k) => SIZES[k].w === w && SIZES[k].h === h);
        if (key) state.size = key;
      }
      // The requested sample goes into the first panel; a diagonal split
      // reads best with the other sample on its second side.
      const sample = photos[photo];
      if (sample) {
        for (let i = 0; i < state.panels.length; i++) {
          state.panels[i].photoId = photo;
        }
        if (state.layout === 'diagonal') {
          const other = photo === 'pier' ? 'boulevard' : 'pier';
          if (photos[other]) state.panels[1].photoId = other;
        }
      }
      state.title = caption;
      $('titleInput').value = caption;
      syncControls();
      redraw();
    });
  } else {
    redraw();
  }
}

boot();
