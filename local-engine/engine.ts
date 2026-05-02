/**
 * VSL Cloner — Motor Local v2 (módulo programático)
 * ----------------------------------------------------------------
 * Versão importável do motor de clonagem. Mesma lógica do `clone.ts`
 * (CLI), mas exposta como uma função `runClone(options)` que pode ser
 * chamada pelo dashboard Next.js, recebendo um callback de progresso.
 *
 * O CLI (`clone.ts`) agora é apenas um wrapper fino que invoca
 * `runClone()` e imprime o progresso no stdout.
 */

import puppeteer, { Browser, HTTPResponse, Page } from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import JSZip from 'jszip';

// ─── Tipos públicos ─────────────────────────────────────────────────────────

export type ProgressEvent =
  | { type: 'log'; message: string; ts: number }
  | { type: 'phase'; phase: string; pct: number; ts: number }
  | { type: 'asset'; url: string; size: number; assetType: string; total: number; ts: number }
  | { type: 'group'; template: string; downloaded: number; total: number; ts: number }
  | { type: 'done'; manifest: CloneManifest; outDir: string; zipPath: string; ts: number }
  | { type: 'error'; message: string; ts: number };

export type ProgressCallback = (e: ProgressEvent) => void;

export interface RunCloneOptions {
  /** URL do funil a clonar (obrigatório). */
  url: string;
  /** Pasta de saída (será criada se não existir). */
  outDir: string;
  /** Callback de progresso em tempo real. */
  onProgress?: ProgressCallback;
  /** Sinal de cancelamento opcional. */
  signal?: AbortSignal;
  /** Headless (default true). Use false para depurar visualmente. */
  headless?: boolean;
}

export interface CloneManifest {
  sourceUrl: string;
  finalUrl: string;
  clonedAt: string;
  totalAssets: number;
  totalBytes: number;
  templates: string[];
  byType: Record<string, { count: number; bytes: number }>;
  assets: { url: string; localPath: string; type: string; size: number }[];
}

export interface RunCloneResult {
  outDir: string;
  zipPath: string;
  manifest: CloneManifest;
}

// ─── Utilitários ────────────────────────────────────────────────────────────

function classify(contentType: string, urlStr: string): string {
  const ct = (contentType || '').toLowerCase();
  const u = urlStr.toLowerCase().split('?')[0].split('#')[0];
  if (ct.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|avif|ico|bmp)$/.test(u)) return 'images';
  if (ct.startsWith('video/') || /\.(mp4|webm|mov|m4v)$/.test(u)) return 'videos';
  if (u.endsWith('.m3u8') || ct.includes('mpegurl') || ct.includes('x-mpegURL')) return 'streams';
  if (u.endsWith('.ts') && !ct.includes('javascript')) return 'streams';
  if (ct.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/.test(u)) return 'audio';
  if (u.endsWith('.vtt') || ct.includes('vtt')) return 'legends';
  if (ct.includes('css') || /\.css$/.test(u)) return 'css';
  if (ct.includes('javascript') || /\.(js|mjs|cjs)$/.test(u)) return 'js';
  if (ct.includes('font') || /\.(woff2?|ttf|otf|eot)$/.test(u)) return 'fonts';
  if (ct.includes('json') || /\.json$/.test(u)) return 'data';
  return 'other';
}

function pathFor(urlStr: string, folder: string, baseOrigin: string): string {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    const safe = urlStr.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    return `assets/${folder}/${safe}`;
  }
  if (u.origin === baseOrigin) {
    let p = u.pathname.replace(/^\/+/, '');
    if (!p || p.endsWith('/') || folder === 'html' || (/\.html?$/i.test(p) === false && !p.includes('.'))) {
      return '__skip__html__';
    }
    return p;
  }
  const base = (u.pathname.split('/').pop() || `file-${Date.now()}`)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80) || 'asset';
  const hash = crypto.createHash('md5').update(urlStr).digest('hex').slice(0, 6);
  return `assets/${folder}/${u.hostname.replace(/[^a-z0-9.-]/g, '_')}/${hash}-${base}`;
}

type Captured = {
  url: string;
  localPath: string;
  type: string;
  buf: Buffer;
  contentType: string;
};

async function pMap<T, R>(items: T[], n: number, fn: (it: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  async function worker() {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, worker));
  return out;
}

// ─── Reescrita ──────────────────────────────────────────────────────────────

function findCapturedFor(captured: Map<string, Captured>, rawUrl: string, baseUrl: string): Captured | undefined {
  try {
    const abs = new URL(rawUrl, baseUrl).toString();
    if (captured.has(abs)) return captured.get(abs);
    const noQ = abs.split('?')[0];
    if (captured.has(noQ)) return captured.get(noQ);
    for (const c of captured.values()) {
      if (c.url.split('?')[0] === noQ) return c;
    }
  } catch {}
  return undefined;
}

function rewriteHtmlContent(captured: Map<string, Captured>, htmlStr: string, baseUrl: string): string {
  htmlStr = htmlStr
    .replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?dataLayer[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?fbq\([\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>/gi, '')
    .replace(/<script[^>]*utmify[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*pixel[^>]*>[\s\S]*?<\/script>/gi, '');
  htmlStr = htmlStr
    .replace(/(src|href|poster|data-src|data-poster|data-href)=("|')([^"']+)\2/gi, (m, attr, q, val) => {
      const c = findCapturedFor(captured, val, baseUrl);
      if (c) return `${attr}=${q}${c.localPath}${q}`;
      return m;
    })
    .replace(/srcset=("|')([^"']+)\1/gi, (m, q, val) => {
      const newVal = val.split(',').map((part: string) => {
        const [u, descriptor] = part.trim().split(/\s+/, 2);
        const c = findCapturedFor(captured, u, baseUrl);
        return [c?.localPath || u, descriptor].filter(Boolean).join(' ');
      }).join(', ');
      return `srcset=${q}${newVal}${q}`;
    })
    .replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, val) => {
      const c = findCapturedFor(captured, val, baseUrl);
      if (c) return `url(${q}${c.localPath}${q})`;
      return m;
    });
  return htmlStr;
}

function rewriteCssContent(captured: Map<string, Captured>, cssStr: string, baseUrl: string, cssLocalPath: string): string {
  return cssStr.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, v) => {
    if (v.startsWith('data:')) return m;
    const c = findCapturedFor(captured, v, baseUrl);
    if (!c) return m;
    const fromDir = path.dirname(cssLocalPath);
    const rel = path.relative(fromDir, c.localPath).split(path.sep).join('/') || c.localPath;
    return `url(${q}${rel}${q})`;
  });
}

function patchJsContent(jsStr: string): string {
  let out = jsStr;
  out = out.replace(/mode\s*:\s*["']history["']/g, 'mode:"hash"');
  out = out.replace(/(\bt\.p\s*=\s*)"\/"/g, '$1""');
  out = out.replace(/(__webpack_require__\.p\s*=\s*)"\/"/g, '$1""');
  out = out.replace(/fetch\(\s*`\s*\/\$\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}\/\s*`/g, 'fetch(String($1).replace(/^\\/+|\\/+$/g,""))');
  out = out.replace(/(["'`])\/{2,}/g, '$1/');
  return out;
}

const STUB = `
<!-- VSL Cloner standalone runtime -->
<script>
  (function(){
    window.fbq = window.fbq || function(){};
    window.gtag = window.gtag || function(){};
    window.dataLayer = window.dataLayer || [];
    window._fbq = window._fbq || function(){};
    var _origFetch = window.fetch;
    window.fetch = function(input, init){
      try {
        if (typeof input === 'string') {
          input = input.replace(/(\\.[a-zA-Z0-9]{2,5})\\/+$/, '$1');
          input = input.replace(/([^:])\\/{2,}/g, '$1/');
        }
      } catch(e){}
      return _origFetch.call(this, input, init);
    };
    if (location.protocol !== 'file:' && !location.hash) {
      var paths = ['/v2','/enviodosdados','/pGwZSDj','/assinatura-poder','/g-ass','/obrigado-correio'];
      var p = location.pathname.replace(/\\/+$/,'');
      for (var i=0; i<paths.length; i++) {
        if (p.endsWith(paths[i])) {
          history.replaceState(null,'', location.pathname.replace(paths[i],'/') + '#' + paths[i]);
          break;
        }
      }
    }
  })();
</script>
`.trim();

// ─── Principal ──────────────────────────────────────────────────────────────

export async function runClone(opts: RunCloneOptions): Promise<RunCloneResult> {
  const { url: targetUrl, outDir: OUT_DIR, signal } = opts;
  const onProgress = opts.onProgress || (() => {});
  const headless = opts.headless !== false;

  const startTime = Date.now();
  const log = (...m: unknown[]) => {
    const message = m.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' ');
    onProgress({ type: 'log', message: `[${((Date.now() - startTime) / 1000).toFixed(1)}s] ${message}`, ts: Date.now() });
  };
  const phase = (name: string, pct: number) => onProgress({ type: 'phase', phase: name, pct, ts: Date.now() });

  const checkAbort = () => {
    if (signal?.aborted) throw new Error('Clone abortado pelo usuário');
  };

  await fs.mkdir(OUT_DIR, { recursive: true });
  const baseOrigin = new URL(targetUrl).origin;

  log(`Alvo:  ${targetUrl}`);
  log(`Saída: ${OUT_DIR}`);
  phase('init', 2);

  // Inicia Puppeteer
  log('Iniciando Chrome (Puppeteer)…');
  const browser: Browser = await puppeteer.launch({
    headless,
    protocolTimeout: 600_000,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 900 });
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8' });

    const captured = new Map<string, Captured>();

    const onResponse = async (response: HTTPResponse) => {
      try {
        const req = response.request();
        const status = response.status();
        if (status >= 400) return;
        const urlStr = response.url();
        if (urlStr.startsWith('data:') || urlStr.startsWith('blob:')) return;
        if (captured.has(urlStr)) return;
        if (/google-analytics|googletagmanager\/gtag|googletagmanager\/gtm|doubleclick|facebook\.com\/tr|google\.com\/(ccm|rmkt|pagead)|cdn-cgi|fbevents|utmify|connect\.facebook|googleadservices|tiktok|hotjar/i.test(urlStr)) {
          return;
        }
        const ct = response.headers()['content-type'] || '';
        if (req.resourceType() === 'document' && urlStr === targetUrl) return;
        const folder = classify(ct, urlStr);
        let buf: Buffer;
        try {
          buf = await response.buffer();
        } catch {
          return;
        }
        if (!buf || buf.length === 0) return;
        if (buf.length > 80 * 1024 * 1024) return;
        const local = pathFor(urlStr, folder, baseOrigin);
        if (local === '__skip__html__') return;
        captured.set(urlStr, { url: urlStr, localPath: local, type: folder, buf, contentType: ct });
        onProgress({ type: 'asset', url: urlStr, size: buf.length, assetType: folder, total: captured.size, ts: Date.now() });
      } catch { /* ignore */ }
    };
    page.on('response', onResponse);

    // 1. Navegação
    phase('navigate', 8);
    log('Navegando até a URL alvo…');
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 90_000 }).catch((e) => {
      log('Aviso: navegação não atingiu networkidle2:', e.message);
    });
    await new Promise((r) => setTimeout(r, 4000));
    checkAbort();
    const finalUrl = page.url();
    let html = await page.content();
    log(`HTML capturado (${html.length} bytes), ${captured.size} assets iniciais.`);

    // 2. Exploração SPA
    phase('explore', 25);
    log('Acionando quiz/SPA para forçar lazy-chunks…');
    async function exploreSpa() {
      const startCount = captured.size;
      try {
        const routes = await page.evaluate(() => {
          const r = (window as any).__VUE_ROUTER__ || (document.querySelector('#app') as any)?.__vue__?.$router;
          if (r && r.options && Array.isArray(r.options.routes)) {
            return r.options.routes.map((x: any) => x.path).filter(Boolean);
          }
          return [];
        });
        if (routes && routes.length) {
          log(`  Rotas detectadas: ${routes.length} (${routes.join(', ')})`);
          for (const route of routes) {
            try {
              await page.evaluate((p: string) => {
                const router = (window as any).__VUE_ROUTER__ || (document.querySelector('#app') as any)?.__vue__?.$router;
                if (router) router.push(p).catch(() => {});
              }, route);
              await new Promise((r) => setTimeout(r, 1500));
            } catch {}
          }
        }
      } catch {}
      for (let i = 0; i < 12; i++) {
        try {
          const clicked = await Promise.race([
            page.evaluate(() => {
              const sel = 'button, .btn, [role=button], a[href]:not([target="_blank"]), [data-action], .option, .quiz-option, .option-button, .quiz-button, .moonphases-step button';
              const btns = ([...document.querySelectorAll(sel)] as HTMLElement[])
                .filter((b) => {
                  if (!b.offsetParent) return false;
                  if (b.closest('iframe')) return false;
                  const t = (b.textContent || '').toLowerCase();
                  if (/comprar|checkout|pagar|finalizar|sair/.test(t)) return false;
                  return true;
                });
              if (!btns.length) return false;
              const b = btns[Math.floor(Math.random() * Math.min(btns.length, 6))];
              b.click();
              return true;
            }),
            new Promise<boolean>((resolve) => setTimeout(() => resolve(false), 5000)),
          ]);
          if (!clicked) break;
        } catch {}
        await new Promise((r) => setTimeout(r, 800));
      }
      await new Promise((r) => setTimeout(r, 2000));
      log(`  Interação capturou ${captured.size - startCount} novos assets.`);
    }
    try {
      await Promise.race([
        exploreSpa(),
        new Promise<void>((resolve) => setTimeout(() => { log('  (timeout de exploração SPA — seguindo)'); resolve(); }, 60_000)),
      ]);
    } catch (e) {
      log('  Erro na exploração SPA:', (e as Error).message);
    }
    log(`Após interação: ${captured.size} assets capturados.`);
    checkAbort();

    // 3. Assets condicionais
    phase('conditional', 50);
    type AssetTemplate = { template: string; variants: string[]; category: string };
    function discoverConditionalAssets(): AssetTemplate[] {
      const templates: AssetTemplate[] = [];
      const numerologyRange = Array.from({ length: 22 }, (_, i) => String(i + 1));
      const p2Variants = [
        'felicidade', 'saude', 'dinheiro', 'amor',
        'h_casado', 'm_casada', 'h_solteiro', 'm_solteira',
        'h_divorciado', 'm_divorciada', 'h_viuvo', 'm_viuva',
        'h_namorando', 'm_namorando', 'h_noivo', 'm_noiva',
      ];
      const patterns: { regex: RegExp; category: string }[] = [
        { regex: /["'`](\.\.\/|\/)?audio\/p1(?:\/v2)?\/["'`+]/g, category: 'audio-p1' },
        { regex: /["'`](\.\.\/|\/)?audio\/p2(?:\/v2)?\/["'`+]/g, category: 'audio-p2' },
        { regex: /["'`](\.\.\/|\/)?animations\/p1v2\/["'`+]/g, category: 'animations-p1' },
        { regex: /["'`](\.\.\/|\/)?animations\/p2v2\/["'`+]/g, category: 'animations-p2' },
        { regex: /["'`](\.\.\/|\/)?legends\/p1(?:\/v2)?\/["'`+]/g, category: 'legends-p1' },
        { regex: /["'`](\.\.\/|\/)?legends\/p2(?:\/v2)?\/["'`+]/g, category: 'legends-p2' },
      ];
      const found = new Set<string>();
      for (const c of captured.values()) {
        if (c.type !== 'js') continue;
        const txt = c.buf.toString('utf-8');
        for (const { regex, category } of patterns) {
          if (regex.test(txt)) found.add(category);
          regex.lastIndex = 0;
        }
      }
      const map: Record<string, AssetTemplate> = {
        'audio-p1':       { template: '/audio/p1/v2/{n}.mp3',         variants: numerologyRange, category: 'audio' },
        'audio-p2':       { template: '/audio/p2/v2/{n}.mp3',         variants: p2Variants,      category: 'audio' },
        'animations-p1':  { template: '/animations/p1v2/{n}.json',    variants: numerologyRange, category: 'animations' },
        'animations-p2':  { template: '/animations/p2v2/{n}.json',    variants: p2Variants,      category: 'animations' },
        'legends-p1':     { template: '/legends/p1/v2/{n}.vtt',       variants: numerologyRange, category: 'legends' },
        'legends-p2':     { template: '/legends/p2/v2/{n}.vtt',       variants: p2Variants,      category: 'legends' },
      };
      for (const k of found) if (map[k]) templates.push(map[k]);
      return templates;
    }

    const templates = discoverConditionalAssets();
    if (templates.length) {
      log(`Descobertos ${templates.length} grupos de assets condicionais. Coletando cookies de sessão do Cloudflare…`);
      const cookies = await page.cookies(targetUrl);
      const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
      const baseHeaders: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
        'Referer': finalUrl,
        'Origin': baseOrigin,
        'Cookie': cookieHeader,
      };

      const totalGroups = templates.length;
      let groupIdx = 0;
      for (const tpl of templates) {
        groupIdx++;
        checkAbort();
        const targets = tpl.variants
          .map((v) => ({ v, url: tpl.template.replace('{n}', v), abs: new URL(tpl.template.replace('{n}', v), finalUrl).toString() }))
          .filter((t) => !captured.has(t.abs));
        if (!targets.length) {
          log(`  ${tpl.template}: já capturado.`);
          onProgress({ type: 'group', template: tpl.template, downloaded: tpl.variants.length, total: tpl.variants.length, ts: Date.now() });
          continue;
        }
        let ok = 0;
        let fallbackToBrowser = false;
        const results = await pMap(targets, 6, async (t) => {
          try {
            const r = await fetch(t.abs, { headers: baseHeaders });
            if (!r.ok) return { t, ok: false as const, status: r.status };
            const ab = await r.arrayBuffer();
            return { t, ok: true as const, ct: r.headers.get('content-type') || '', buf: Buffer.from(ab) };
          } catch (e) {
            return { t, ok: false as const, err: (e as Error).message };
          }
        });
        for (const r of results) {
          if (!r.ok) { fallbackToBrowser = true; continue; }
          const folder = classify(r.ct || '', r.t.url);
          const local = pathFor(r.t.abs, folder, baseOrigin);
          if (local === '__skip__html__') { ok++; continue; }
          captured.set(r.t.abs, { url: r.t.abs, localPath: local, type: folder, buf: r.buf!, contentType: r.ct || '' });
          ok++;
        }
        if (fallbackToBrowser) {
          const remaining = targets.filter((t) => !captured.has(t.abs));
          log(`  ${tpl.template}: ${ok}/${targets.length} via fetch nativo. Tentando ${remaining.length} via navegador…`);
          for (const t of remaining) {
            try {
              const data: any = await page.evaluate(async (u: string) => {
                try {
                  const r = await fetch(u, { method: 'GET', credentials: 'include' });
                  if (!r.ok) return { ok: false, status: r.status };
                  const ab = await r.arrayBuffer();
                  const bytes = new Uint8Array(ab);
                  let bin = '';
                  const CHUNK = 0x8000;
                  for (let i = 0; i < bytes.length; i += CHUNK) {
                    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK) as unknown as number[]);
                  }
                  return { ok: true, status: r.status, ct: r.headers.get('content-type') || '', b64: btoa(bin) };
                } catch (e) {
                  return { ok: false, err: (e as Error).message };
                }
              }, t.url);
              if (!data.ok) continue;
              const buf = Buffer.from(data.b64, 'base64');
              const folder = classify(data.ct || '', t.url);
              const local = pathFor(t.abs, folder, baseOrigin);
              if (local === '__skip__html__') { ok++; continue; }
              captured.set(t.abs, { url: t.abs, localPath: local, type: folder, buf, contentType: data.ct || '' });
              ok++;
            } catch {}
          }
        }
        log(`  ${tpl.template}: ${ok}/${targets.length} baixados.`);
        onProgress({ type: 'group', template: tpl.template, downloaded: ok, total: targets.length, ts: Date.now() });
        phase('conditional', 50 + Math.floor((groupIdx / totalGroups) * 25));
      }
    }

    // 4. Reescrita
    phase('rewrite', 80);
    log('Reescrevendo HTML principal…');
    html = rewriteHtmlContent(captured, html, finalUrl);
    html = html.replace(/<\/head>/i, STUB + '\n</head>');
    await fs.writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf-8');

    log('Reescrevendo CSS e patchando JS chunks…');
    for (const c of captured.values()) {
      if (c.type === 'css') {
        const txt = c.buf.toString('utf-8');
        c.buf = Buffer.from(rewriteCssContent(captured, txt, c.url, c.localPath), 'utf-8');
      } else if (c.type === 'js') {
        const txt = c.buf.toString('utf-8');
        c.buf = Buffer.from(patchJsContent(txt), 'utf-8');
      }
    }

    // 5. Salva arquivos
    phase('write', 88);
    log(`Gravando ${captured.size} arquivos em disco…`);
    for (const c of captured.values()) {
      const full = path.join(OUT_DIR, c.localPath);
      await fs.mkdir(path.dirname(full), { recursive: true });
      await fs.writeFile(full, c.buf);
    }

    // Manifest
    const byType: Record<string, { count: number; bytes: number }> = {};
    for (const c of captured.values()) {
      byType[c.type] = byType[c.type] || { count: 0, bytes: 0 };
      byType[c.type].count++;
      byType[c.type].bytes += c.buf.length;
    }
    const manifest: CloneManifest = {
      sourceUrl: targetUrl,
      finalUrl,
      clonedAt: new Date().toISOString(),
      totalAssets: captured.size,
      totalBytes: [...captured.values()].reduce((s, e) => s + e.buf.length, 0),
      templates: templates.map((t) => t.template),
      byType,
      assets: [...captured.values()].map((e) => ({
        url: e.url, localPath: e.localPath, type: e.type, size: e.buf.length,
      })),
    };
    await fs.writeFile(path.join(OUT_DIR, 'clone-manifest.json'), JSON.stringify(manifest, null, 2));
    await fs.writeFile(
      path.join(OUT_DIR, 'README.txt'),
      `VSL Cloner — Pacote standalone (motor local v2)

Origem:  ${targetUrl}
Final:   ${finalUrl}
Data:    ${manifest.clonedAt}
Assets:  ${manifest.totalAssets} arquivos (${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MB)

Para visualizar localmente:
  npx http-server -c-1 -p 8080
  http://localhost:8080/

Funciona em qualquer servidor estático. Vue Router está em modo hash (#/).
`
    );

    // 6. ZIP
    phase('zip', 94);
    log('Gerando clone.zip…');
    const zip = new JSZip();
    async function addDir(rel: string) {
      const abs = path.join(OUT_DIR, rel);
      const stat = await fs.stat(abs);
      if (stat.isDirectory()) {
        for (const it of await fs.readdir(abs)) await addDir(path.join(rel, it));
      } else {
        const buf = await fs.readFile(abs);
        zip.file(rel.split(path.sep).join('/'), buf);
      }
    }
    for (const it of await fs.readdir(OUT_DIR)) {
      if (it === 'clone.zip') continue;
      await addDir(it);
    }
    const zipBuf = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });
    const zipPath = path.join(OUT_DIR, 'clone.zip');
    await fs.writeFile(zipPath, zipBuf);
    log(`clone.zip (${(zipBuf.length / 1024 / 1024).toFixed(2)} MB)`);

    phase('done', 100);
    onProgress({ type: 'done', manifest, outDir: OUT_DIR, zipPath, ts: Date.now() });

    return { outDir: OUT_DIR, zipPath, manifest };
  } finally {
    try { await browser.close(); } catch {}
  }
}
