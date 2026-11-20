// serve.ts — server statis kecil untuk menjalankan app/ secara lokal.
//
// Hanya pustaka standar Node 22. Pemakaian: `node serve.ts` mendengarkan
// di 127.0.0.1:8080; `node serve.ts --port 9000` memakai port lain.
// Jalur yang mencoba keluar dari folder app/ ditolak dengan 403, berkas
// yang tidak ada mendapat 404, dan semua respons memakai cache no-store
// supaya perubahan saat mengembangkan langsung terlihat.

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), 'app');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.txt': 'text/plain; charset=utf-8',
};

let port = 8080;
const args = process.argv.slice(2);
const portAt = args.indexOf('--port');
if (portAt >= 0 && args[portAt + 1]) port = Number(args[portAt + 1]);

const server = createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';

  const filePath = normalize(join(root, urlPath));
  if (filePath !== root && !filePath.startsWith(root + '/')) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('Forbidden');
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found');
    return;
  }
  const stat = statSync(filePath);
  res.writeHead(200, {
    'content-type': MIME[extname(filePath).toLowerCase()] || 'application/octet-stream',
    'content-length': stat.size,
    'cache-control': 'no-store',
  });
  createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Neon Coast Cover Studio at http://localhost:${port}`);
});
