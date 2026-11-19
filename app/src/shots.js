// Fixed scenes for screenshots: ?shot=editor shows the full studio with a
// sample photo; ?shot=cover shows the cover alone, full-bleed.
// `photo` picks the sample (samples/<photo>.jpg), `caption` the title,
// `layout` and `grade` pick the look, `size` (WxH) the export size.
// window.__shotReady is set once the fonts are loaded and the cover painted.
export async function runShot(shot, query, setup) {
  if (shot === 'cover') document.body.classList.add('shot-cover');
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Sunset Heist';
  const layout = query.get('layout') ?? null;
  const grade = query.get('grade') ?? null;
  const size = query.get('size') ?? null;
  await setup({ photo, caption, layout, grade, size });
  try {
    await document.fonts.ready;
    await document.fonts.load('100px Anton');
    await document.fonts.load('40px Pacifico');
  } catch { /* fonts fall back to the system stack */ }
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
