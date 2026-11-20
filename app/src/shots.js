// shots.js — adegan tangkapan layar untuk harness make.fun.
//
// Saat URL membawa parameter ?shot=..., modul ini menyiapkan editor ke
// keadaan yang diminta adegan, menunggu font selesai dimuat, lalu memberi
// tanda window.__shotReady setelah dua frame animasi agar harness tahu
// kanvas sudah stabil dan aman difoto.

export async function runShot(shot, query, setup) {
  if (shot === 'cover') {
    document.body.classList.add('shot-cover');
  }

  const photo = query.get('photo') || 'pier';
  const caption = query.get('caption') || 'Sunset Heist';
  const layout = query.get('layout');
  const grade = query.get('grade');
  const size = query.get('size');

  await setup({ photo, caption, layout, grade, size });

  // Font judul harus benar-benar siap sebelum foto diambil, kalau tidak
  // tangkapan layar akan memakai font cadangan sistem.
  try {
    await document.fonts.ready;
    await document.fonts.load('100px Anton');
    await document.fonts.load('40px Pacifico');
  } catch (err) {
    // Kegagalan memuat font tidak boleh menggagalkan adegan; editor tetap
    // tampil dengan font cadangan.
  }

  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  window.__shotReady = true;
}
