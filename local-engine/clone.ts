/**
 * VSL Cloner — Motor Local v2 (CLI wrapper)
 * ----------------------------------------------------------------
 * A lógica de clonagem agora vive em `engine.ts` (importável).
 * Este arquivo expõe o motor pela linha de comando, imprimindo
 * progresso no stdout e subindo um servidor estático local com
 * preview ao final.
 *
 * Uso:
 *   npx tsx clone.ts <URL> [--out=pasta] [--no-preview] [--port=8080]
 */

import path from 'node:path';
import http from 'node:http';
import fs from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { runClone } from './engine.js';

const args = process.argv.slice(2);
const flags: Record<string, string | boolean> = {};
const positional: string[] = [];
for (const a of args) {
  if (a.startsWith('--')) {
    const [k, v] = a.replace(/^--/, '').split('=');
    flags[k] = v ?? true;
  } else {
    positional.push(a);
  }
}
const targetUrl = positional[0];
if (!targetUrl) {
  console.error('Uso: npx tsx clone.ts <URL> [--out=pasta] [--no-preview] [--port=8080]');
  process.exit(1);
}

const HOST = (() => {
  try { return new URL(targetUrl).hostname; } catch { return 'site'; }
})();
const OUT_DIR = path.resolve(process.cwd(), (flags.out as string) || `out/${HOST}`);
const PORT = parseInt((flags.port as string) || '8080', 10);
const SHOW_PREVIEW = flags['no-preview'] !== true;

const result = await runClone({
  url: targetUrl,
  outDir: OUT_DIR,
  onProgress: (e) => {
    if (e.type === 'log') console.log(e.message);
    else if (e.type === 'phase') console.log(`  [${e.pct.toString().padStart(3)}%] ${e.phase}`);
    else if (e.type === 'group') console.log(`  ${e.template}: ${e.downloaded}/${e.total} baixados.`);
    else if (e.type === 'error') console.error('ERRO:', e.message);
  },
});

const { manifest, zipPath, outDir } = result;
console.log('\n══════════════════════════════════════════════════════════');
console.log(' Clone concluído');
console.log('══════════════════════════════════════════════════════════');
console.log(` Pasta:  ${outDir}`);
console.log(` Total:  ${manifest.totalAssets} arquivos / ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(` ZIP:    ${zipPath}`);
console.log(' Por tipo:');
for (const [k, v] of Object.entries(manifest.byType).sort()) {
  console.log(`   ${k.padEnd(10)} ${String(v.count).padStart(4)}  (${(v.bytes / 1024).toFixed(0)} KB)`);
}

if (!SHOW_PREVIEW) process.exit(0);

console.log(`\nSubindo servidor local em http://localhost:${PORT}/ …`);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.mp3':  'audio/mpeg',
  '.mp4':  'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.vtt':  'text/vtt; charset=utf-8',
  '.m3u8': 'application/x-mpegURL',
  '.ts':   'video/MP2T',
  '.txt':  'text/plain; charset=utf-8',
  '.zip':  'application/zip',
};

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
    urlPath = urlPath.replace(/\/+$/, '') || '/';
    if (urlPath === '/') urlPath = '/index.html';
    const safe = path.normalize(urlPath).replace(/^([\\/])+/, '');
    const filePath = path.join(OUT_DIR, safe);
    if (!filePath.startsWith(OUT_DIR)) { res.statusCode = 403; res.end('Forbidden'); return; }
    let buf: Buffer;
    let p = filePath;
    try { buf = await fs.readFile(p); }
    catch { p = path.join(OUT_DIR, 'index.html'); buf = await fs.readFile(p); }
    const ext = path.extname(p).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.end(buf);
  } catch (e) {
    res.statusCode = 500;
    res.end(String((e as Error).message));
  }
});

server.listen(PORT, () => {
  const u = `http://localhost:${PORT}/`;
  console.log(`\n  Preview rodando em: ${u}`);
  console.log('  Pressione Ctrl+C para encerrar.');
  const opener =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32'  ? 'start' :
    'xdg-open';
  try { spawn(opener, [u], { detached: true, stdio: 'ignore' }).unref(); } catch {}
});
