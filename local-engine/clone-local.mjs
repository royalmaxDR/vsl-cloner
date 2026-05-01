#!/usr/bin/env node
/**
 * VSL Cloner — Motor Local (Puppeteer full)
 *
 * Para sites com Cloudflare ou SPAs pesadas que a Vercel não consegue clonar,
 * rode este script no seu próprio computador. Ele usa Puppeteer "full"
 * (com Chromium completo) para furar proteções e capturar a página
 * 100% renderizada, com TODOS os assets (incluindo XHR/fetch e WebSocket
 * iniciais) e empacota tudo num ZIP.
 *
 * Uso:
 *   1. Instalar dependências (uma única vez):
 *        cd local-engine && npm install
 *   2. Rodar o clonador:
 *        node clone-local.mjs <URL> [pasta-saida]
 *      Exemplo: node clone-local.mjs https://exemplo.com out/
 *   3. (Opcional) Subir o clone direto pro seu painel:
 *        node clone-local.mjs <URL> <projectId> --upload \
 *          --supabase-url=... --supabase-anon-key=... --user-token=...
 *
 * O ZIP gerado é compatível com qualquer servidor estático
 * (npx http-server, Vercel, Netlify, S3, GitHub Pages).
 */
import puppeteer from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import JSZip from 'jszip';

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args
    .filter((a) => a.startsWith('--'))
    .map((a) => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
);
const positional = args.filter((a) => !a.startsWith('--'));
const url = positional[0];
const outArg = positional[1] || `out/${new URL(url || 'https://example.com').hostname || 'site'}`;

if (!url) {
  console.error('Uso: node clone-local.mjs <URL> [pasta-saida] [--upload --project-id=...]');
  process.exit(1);
}

const OUT_DIR = path.resolve(process.cwd(), outArg);
await fs.mkdir(OUT_DIR, { recursive: true });
await fs.mkdir(path.join(OUT_DIR, 'assets'), { recursive: true });

console.log(`[clone-local] Alvo: ${url}`);
console.log(`[clone-local] Saída: ${OUT_DIR}`);

const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});

const page = await browser.newPage();
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
);
await page.setExtraHTTPHeaders({
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
});

/** Mapa: url → { localPath, type, buf } */
const captured = new Map();

function classify(contentType, urlStr) {
  const ct = (contentType || '').toLowerCase();
  const u = urlStr.toLowerCase().split('?')[0];
  if (ct.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|avif|ico)$/.test(u)) return 'images';
  if (ct.startsWith('video/') || /\.(mp4|webm|mov)$/.test(u)) return 'videos';
  if (ct.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/.test(u)) return 'audio';
  if (ct.includes('javascript') || /\.(js|mjs)$/.test(u)) return 'js';
  if (ct.includes('css') || /\.css$/.test(u)) return 'css';
  if (ct.includes('font') || /\.(woff2?|ttf|otf|eot)$/.test(u)) return 'fonts';
  if (ct.includes('json') || /\.json$/.test(u)) return 'data';
  return 'other';
}

function pathFor(urlStr, folder) {
  let pathname;
  try {
    pathname = new URL(urlStr).pathname;
  } catch {
    pathname = urlStr;
  }
  let base = pathname.split('/').pop() || `file-${Date.now()}`;
  base = base.split('?')[0].split('#')[0].replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
  const hash = crypto.createHash('md5').update(urlStr).digest('hex').slice(0, 6);
  return `assets/${folder}/${hash}-${base}`;
}

// Captura responses
page.on('response', async (response) => {
  try {
    const req = response.request();
    if (req.resourceType() === 'document') return;
    const status = response.status();
    if (status >= 400) return;
    const urlStr = response.url();
    if (urlStr.startsWith('data:') || urlStr.startsWith('blob:')) return;
    if (captured.has(urlStr)) return;

    const ct = response.headers()['content-type'] || '';
    const folder = classify(ct, urlStr);
    const local = pathFor(urlStr, folder);
    let buf;
    try {
      buf = await response.buffer();
    } catch {
      return;
    }
    if (!buf || buf.length === 0) return;
    if (buf.length > 30 * 1024 * 1024) return; // ignora >30MB
    captured.set(urlStr, { localPath: local, type: folder, buf });
  } catch {
    /* ignore */
  }
});

console.log('[clone-local] Navegando…');
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
await new Promise((r) => setTimeout(r, 3500)); // tempo extra para players VSL

const finalUrl = page.url();
let html = await page.content();

console.log(`[clone-local] HTML capturado (${html.length} bytes), assets: ${captured.size}`);

// Reescreve atributos no HTML
function rewriteHtml(htmlStr) {
  return htmlStr
    .replace(/(src|href|poster|data-src|data-poster)=("|')([^"']+)\2/gi, (m, attr, q, val) => {
      try {
        const abs = new URL(val, finalUrl).toString();
        const c = captured.get(abs);
        if (c) return `${attr}=${q}${c.localPath}${q}`;
      } catch {}
      return m;
    })
    .replace(/srcset=("|')([^"']+)\1/gi, (m, q, val) => {
      const newVal = val
        .split(',')
        .map((part) => {
          const [u, descriptor] = part.trim().split(/\s+/, 2);
          try {
            const abs = new URL(u, finalUrl).toString();
            const c = captured.get(abs);
            return [c?.localPath || u, descriptor].filter(Boolean).join(' ');
          } catch {
            return part.trim();
          }
        })
        .join(', ');
      return `srcset=${q}${newVal}${q}`;
    })
    .replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, val) => {
      try {
        const abs = new URL(val, finalUrl).toString();
        const c = captured.get(abs);
        if (c) return `url(${q}${c.localPath}${q})`;
      } catch {}
      return m;
    });
}

html = rewriteHtml(html);

// Reescreve CSS dos arquivos baixados
for (const [, entry] of captured) {
  if (entry.type !== 'css') continue;
  try {
    const css = entry.buf.toString('utf-8');
    const rewritten = css.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, v) => {
      try {
        const abs = new URL(v, finalUrl).toString();
        const c = captured.get(abs);
        if (c) return `url(${q}../../${c.localPath}${q})`;
      } catch {}
      return m;
    });
    entry.buf = Buffer.from(rewritten, 'utf-8');
  } catch {
    /* ignore */
  }
}

// Salva arquivos no disco
await fs.writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf-8');
for (const [, entry] of captured) {
  const full = path.join(OUT_DIR, entry.localPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, entry.buf);
}

const manifest = {
  sourceUrl: url,
  finalUrl,
  clonedAt: new Date().toISOString(),
  totalAssets: captured.size,
  totalBytes: [...captured.values()].reduce((s, e) => s + e.buf.length, 0),
  assets: [...captured.entries()].map(([url, e]) => ({
    url,
    localPath: e.localPath,
    type: e.type,
    size: e.buf.length,
  })),
};
await fs.writeFile(
  path.join(OUT_DIR, 'clone-manifest.json'),
  JSON.stringify(manifest, null, 2)
);

await fs.writeFile(
  path.join(OUT_DIR, 'README.txt'),
  `VSL Cloner — Pacote standalone (motor local Puppeteer)\n\n` +
    `Origem: ${url}\nURL final: ${finalUrl}\n` +
    `Clonado em: ${manifest.clonedAt}\n` +
    `Assets: ${manifest.totalAssets} (${(manifest.totalBytes / 1024).toFixed(1)} KB)\n\n` +
    `Para visualizar:\n  npx http-server -c-1\n  http://localhost:8080\n`
);

// Gera ZIP
console.log('[clone-local] Gerando clone.zip…');
const zip = new JSZip();
async function addDir(rel) {
  const abs = path.join(OUT_DIR, rel);
  const stat = await fs.stat(abs);
  if (stat.isDirectory()) {
    const items = await fs.readdir(abs);
    for (const it of items) await addDir(path.join(rel, it));
  } else {
    const buf = await fs.readFile(abs);
    zip.file(rel.split(path.sep).join('/'), buf);
  }
}
const items = await fs.readdir(OUT_DIR);
for (const it of items) {
  if (it === 'clone.zip') continue;
  await addDir(it);
}
const zipBuf = await zip.generateAsync({
  type: 'nodebuffer',
  compression: 'DEFLATE',
  compressionOptions: { level: 6 },
});
await fs.writeFile(path.join(OUT_DIR, 'clone.zip'), zipBuf);

await browser.close();

console.log(`\n✓ Clone concluído!`);
console.log(`  Pasta: ${OUT_DIR}`);
console.log(`  Assets: ${manifest.totalAssets}`);
console.log(`  Tamanho: ${(zipBuf.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`  ZIP: ${path.join(OUT_DIR, 'clone.zip')}`);
console.log(`\nPara testar:\n  cd "${OUT_DIR}" && npx http-server -c-1`);

// ─── Upload opcional para o painel ──────────────────────────────────────────
if (flags.upload) {
  const projectId = flags['project-id'] || positional[1];
  const supabaseUrl = flags['supabase-url'];
  const anonKey = flags['supabase-anon-key'];
  const userToken = flags['user-token'];
  if (!projectId || !supabaseUrl || !anonKey || !userToken) {
    console.error(
      '[upload] Faltam flags: --project-id, --supabase-url, --supabase-anon-key, --user-token'
    );
    process.exit(2);
  }

  console.log('[upload] Enviando arquivos para o painel…');
  const headersAuth = { Authorization: `Bearer ${userToken}`, apikey: anonKey };
  const bucket = 'clones';

  // Resolve user id pelo token
  const meRes = await fetch(`${supabaseUrl}/auth/v1/user`, { headers: headersAuth });
  const me = await meRes.json();
  const userId = me?.id;
  if (!userId) {
    console.error('[upload] Token inválido');
    process.exit(3);
  }
  const baseFolder = `users/${userId}/projects/${projectId}`;

  // Lista entradas a enviar = todos os arquivos do OUT_DIR
  async function* walk(dir) {
    for (const it of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, it.name);
      if (it.isDirectory()) yield* walk(full);
      else yield full;
    }
  }
  let okCount = 0;
  let failCount = 0;
  for await (const file of walk(OUT_DIR)) {
    const rel = path.relative(OUT_DIR, file).split(path.sep).join('/');
    const buf = await fs.readFile(file);
    const target = `${baseFolder}/${rel}`;
    const r = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${target}`, {
      method: 'POST',
      headers: {
        ...headersAuth,
        'x-upsert': 'true',
        'Content-Type': guessCT(rel),
      },
      body: buf,
    });
    if (r.ok) okCount++;
    else {
      failCount++;
      const t = await r.text();
      console.warn(`[upload] Falha ${rel}: ${r.status} ${t.slice(0, 100)}`);
    }
  }
  console.log(`[upload] Concluído: ${okCount} ok / ${failCount} fail`);
  console.log(
    `[upload] Preview: ${supabaseUrl}/storage/v1/object/public/${bucket}/${baseFolder}/index.html`
  );
}

function guessCT(name) {
  if (name.endsWith('.html')) return 'text/html; charset=utf-8';
  if (name.endsWith('.css')) return 'text/css; charset=utf-8';
  if (name.endsWith('.js') || name.endsWith('.mjs')) return 'application/javascript';
  if (name.endsWith('.json')) return 'application/json';
  if (name.endsWith('.svg')) return 'image/svg+xml';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.webp')) return 'image/webp';
  if (name.endsWith('.mp4')) return 'video/mp4';
  if (name.endsWith('.mp3')) return 'audio/mpeg';
  if (name.endsWith('.woff2')) return 'font/woff2';
  if (name.endsWith('.woff')) return 'font/woff';
  return 'application/octet-stream';
}
