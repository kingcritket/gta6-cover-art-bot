// main.ts — titik masuk penyerahan make.fun untuk Neon Coast Cover Studio.
//
// Aplikasi webnya sendiri adalah berkas statis biasa di folder app/ (tanpa
// langkah build, tanpa jaringan saat runtime). Tugas berkas ini hanya
// mengemas penyerahan: menyalin app/ dan screenshots/ ke folder keluaran,
// lalu meminta pembangun dossier dari vendor untuk menulis dossier.json
// di sebelahnya. Hanya pustaka standar Node 22 yang dipakai.
//
// Folder keluaran diambil dari MAKEFUN_OUTPUT_DIR, atau /output bila
// variabel itu tidak disetel.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outDir, 'dossier.json'), dossier);

console.log(`dossier.json written to ${outDir} (${dossier.length} bytes)`);
