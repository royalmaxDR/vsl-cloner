#!/usr/bin/env -S npx tsx
/**
 * VSL Cloner — Motor Local v2 (clone.ts)
 * ----------------------------------------------------------------
 * Clona funis VSL complexos (Vue 2 + Webpack + Cloudflare + áudios
 * condicionais + animações Lottie + legendas VTT + VTurb/ConverteAI)
 * com UM único comando.
 *
 * Uso:
 *   npx tsx clone.ts <URL> [--out=pasta] [--no-preview] [--port=8080]
 *
 * Exemplo:
 *   npx tsx clone.ts https://testexamanico.misteriosdaalma.com/v2
 *
 * O motor:
 *   1. Abre um Chrome real via Puppeteer (passa por Cloudflare).
 *   2. Captura tudo que a página baixa: HTML, CSS, JS chunks, imagens,
 *      áudios MP3, animações Lottie (JSON), legendas VTT, m3u8.
 *   3. Inspeciona os JS chunks do Webpack para descobrir TODOS os
 *      assets condicionais (audio/p1/v2/{1..22}.mp3, audio/p2/v2/*.mp3,
 *      animations/p1v2/*.json, legends/p1/v2/*.vtt etc.) e baixa-os
 *      DENTRO do contexto do navegador (mesma origem) para furar
 *      Cloudflare.
 *   4. Reescreve paths para funcionar standalone (sem dependência do
 *      servidor original): caminhos absolutos viram relativos, Vue
 *      Router converte de mode:"history" para hash, e o bug do
 *      trailing slash em getJsonData(`/${t}/`) é corrigido.
 *   5. Empacota tudo em ZIP (clone.zip).
 *   6. Sobe um servidor estático local em http://localhost:8080 com o
 *      clone funcionando, e abre o navegador.
 */

import puppeteer, { Browser, HTTPResponse, Page } from 'puppeteer';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import http from 'node:http';
import { spawn } from 'node:child_process';
import JSZip from 'jszip';

// ─── CLI ────────────────────────────────────────────────────────────────────
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

await fs.mkdir(OUT_DIR, { recursive: true });

const startTime = Date.now();
const log = (...m: unknown[]) => console.log(`[${((Date.now() - startTime) / 1000).toFixed(1)}s]`, ...m);

log(`Alvo:  ${targetUrl}`);
log(`Saída: ${OUT_DIR}`);

// ─── Estrutura de captura ───────────────────────────────────────────────────
type Captured = {
  url: string;
  localPath: string;   // caminho relativo dentro do OUT_DIR
  type: string;
  buf: Buffer;
  contentType: string;
};
const captured = new Map<string, Captured>();

// Mapeia URL → localPath para reescrita
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

/**
 * Calcula o caminho local "amigável" para uma URL.
 * Mantém estrutura de diretórios original quando é mesmo-origem
 * (essencial para que `audio/p1/v2/8.mp3` resolva sem reescrever JS).
 */
function pathFor(urlStr: string, folder: string, baseOrigin: string): string {
  let u: URL;
  try {
    u = new URL(urlStr);
  } catch {
    const safe = urlStr.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    return `assets/${folder}/${safe}`;
  }
  // Mesmo-origem → preserva o pathname inteiro (sem barra inicial)
  if (u.origin === baseOrigin) {
    let p = u.pathname.replace(/^\/+/, '');
    // Para HTML same-origin (a própria página ou suas rotas), não salvamos no disco aqui:
    // o index.html principal será escrito pela etapa final de reescrita.
    if (!p || p.endsWith('/') || folder === 'html' || /\.html?$/i.test(p) === false && !p.includes('.')) {
      return '__skip__html__';
    }
    return p;
  }
  // Externos → vira assets/<folder>/<host>/<basename> com hash
  const base = (u.pathname.split('/').pop() || `file-${Date.now()}`)
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80) || 'asset';
  const hash = crypto.createHash('md5').update(urlStr).digest('hex').slice(0, 6);
  return `assets/${folder}/${u.hostname.replace(/[^a-z0-9.-]/g, '_')}/${hash}-${base}`;
}

// ─── Inicia Puppeteer ───────────────────────────────────────────────────────
log('Iniciando Chrome (Puppeteer)…');
const browser: Browser = await puppeteer.launch({
  headless: true,
  protocolTimeout: 600_000, // 10 min — necessário para baixar áudios grandes via fetch no contexto da página
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-blink-features=AutomationControlled',
  ],
});
const page: Page = await browser.newPage();
await page.setViewport({ width: 1366, height: 900 });
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
);
await page.setExtraHTTPHeaders({
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
});

const baseOrigin = new URL(targetUrl).origin;

const onResponse = async (response: HTTPResponse) => {
  try {
    const req = response.request();
    const status = response.status();
    if (status >= 400) return;
    const urlStr = response.url();
    if (urlStr.startsWith('data:') || urlStr.startsWith('blob:')) return;
    if (captured.has(urlStr)) return;

    // Ignora analytics/telemetria que polui o pacote
    if (/google-analytics|googletagmanager\/gtag|googletagmanager\/gtm|doubleclick|facebook\.com\/tr|google\.com\/(ccm|rmkt|pagead)|cdn-cgi|fbevents|utmify|connect\.facebook|googleadservices|tiktok|hotjar/i.test(urlStr)) {
      return;
    }

    const ct = response.headers()['content-type'] || '';
    if (req.resourceType() === 'document' && urlStr === targetUrl) {
      // documento principal, salvo separadamente
      return;
    }

    const folder = classify(ct, urlStr);
    let buf: Buffer;
    try {
      buf = await response.buffer();
    } catch {
      return;
    }
    if (!buf || buf.length === 0) return;
    if (buf.length > 80 * 1024 * 1024) return; // ignora >80MB

    const local = pathFor(urlStr, folder, baseOrigin);
    if (local === '__skip__html__') return; // HTML same-origin será reescrito depois
    captured.set(urlStr, { url: urlStr, localPath: local, type: folder, buf, contentType: ct });
  } catch {
    /* ignore */
  }
};
page.on('response', onResponse);

// ─── 1. Carrega a página alvo ───────────────────────────────────────────────
log('Navegando até a URL alvo…');
await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 90_000 }).catch((e) => {
  log('Aviso: navegação não atingiu networkidle2:', e.message);
});
await new Promise((r) => setTimeout(r, 4000));
const finalUrl = page.url();

let html = await page.content();
log(`HTML capturado (${html.length} bytes), ${captured.size} assets iniciais.`);

// ─── 2. Interage com o quiz para forçar carregamento de chunks lazy ─────────
log('Acionando quiz/SPA para forçar lazy-chunks…');
async function exploreSpa() {
  const startCount = captured.size;
  // 1. Visita programaticamente todas as rotas conhecidas (Vue Router) para
  //    forçar o webpack a baixar TODOS os chunks lazy.
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
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }

  // 2. Clica em até 12 botões/options visíveis com timeout curto, com retry.
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
    } catch { /* ignore */ }
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

// ─── 3. Inspeciona JS chunks para descobrir assets condicionais ─────────────
type AssetTemplate = {
  template: string;          // ex: '/audio/p1/v2/{n}.mp3'
  variants: string[];        // ex: ['1','2',...,'22'] OU ['felicidade','saude',...]
  category: string;          // 'audio' | 'animations' | 'legends'
};

function discoverConditionalAssets(): AssetTemplate[] {
  const templates: AssetTemplate[] = [];
  const numerologyRange = Array.from({ length: 22 }, (_, i) => String(i + 1));
  // Variantes de p2 baseadas no padrão observado em funis Vue/numerologia.
  // Inclui combinações conhecidas + algumas extras como fallback.
  const p2Variants = [
    'felicidade', 'saude', 'dinheiro', 'amor',
    'h_casado', 'm_casada',
    'h_solteiro', 'm_solteira',
    'h_divorciado', 'm_divorciada',
    'h_viuvo', 'm_viuva',
    'h_namorando', 'm_namorando',
    'h_noivo', 'm_noiva',
  ];

  // Vasculha JS já capturado por padrões de path
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

  // Estratégia: pega o cookie `cf_clearance` (e demais) do navegador e usa fetch nativo do Node
  // em paralelo. Isso é MUITO mais rápido que serializar via page.evaluate(base64).
  const cookies = await page.cookies(targetUrl);
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join('; ');
  const baseHeaders: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8',
    'Referer': finalUrl,
    'Origin': baseOrigin,
    'Cookie': cookieHeader,
  };

  // Limita concorrência para não estourar conexão / servidor
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

  for (const tpl of templates) {
    const targets = tpl.variants
      .map((v) => ({ v, url: tpl.template.replace('{n}', v), abs: new URL(tpl.template.replace('{n}', v), finalUrl).toString() }))
      .filter((t) => !captured.has(t.abs));
    if (!targets.length) { log(`  ${tpl.template}: já capturado.`); continue; }

    let ok = 0;
    let fallbackToBrowser = false;
    const results = await pMap(targets, 6, async (t) => {
      try {
        const r = await fetch(t.abs, { headers: baseHeaders });
        if (!r.ok) return { t, ok: false, status: r.status };
        const ab = await r.arrayBuffer();
        return { t, ok: true, ct: r.headers.get('content-type') || '', buf: Buffer.from(ab) };
      } catch (e) {
        return { t, ok: false, err: (e as Error).message };
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

    // Se algum falhou, tenta no contexto do browser (passa Cloudflare 100%)
    if (fallbackToBrowser) {
      const remaining = targets.filter((t) => !captured.has(t.abs));
      log(`  ${tpl.template}: ${ok}/${targets.length} via fetch nativo. Tentando ${remaining.length} via navegador…`);
      for (const t of remaining) {
        try {
          const data = await page.evaluate(async (u: string) => {
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
          const buf = Buffer.from(data.b64!, 'base64');
          const folder = classify(data.ct || '', t.url);
          const local = pathFor(t.abs, folder, baseOrigin);
          if (local === '__skip__html__') { ok++; continue; }
          captured.set(t.abs, { url: t.abs, localPath: local, type: folder, buf, contentType: data.ct || '' });
          ok++;
        } catch { /* ignore */ }
      }
    }
    log(`  ${tpl.template}: ${ok}/${targets.length} baixados.`);
  }
}

// ─── 4. Reescrita ───────────────────────────────────────────────────────────
function findCapturedFor(rawUrl: string, baseUrl: string): Captured | undefined {
  try {
    const abs = new URL(rawUrl, baseUrl).toString();
    if (captured.has(abs)) return captured.get(abs);
    // Tenta sem query
    const noQ = abs.split('?')[0];
    if (captured.has(noQ)) return captured.get(noQ);
    for (const c of captured.values()) {
      if (c.url.split('?')[0] === noQ) return c;
    }
  } catch {}
  return undefined;
}

function rewriteHtmlContent(htmlStr: string, baseUrl: string): string {
  // Remove scripts de analytics (que poluem e podem rastrear o clone)
  htmlStr = htmlStr
    .replace(/<script[^>]*googletagmanager[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?dataLayer[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?fbq\([\s\S]*?<\/script>/gi, '')
    .replace(/<noscript[^>]*>[\s\S]*?googletagmanager[\s\S]*?<\/noscript>/gi, '')
    .replace(/<script[^>]*utmify[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*pixel[^>]*>[\s\S]*?<\/script>/gi, '');

  htmlStr = htmlStr
    .replace(/(src|href|poster|data-src|data-poster|data-href)=("|')([^"']+)\2/gi, (m, attr, q, val) => {
      const c = findCapturedFor(val, baseUrl);
      if (c) return `${attr}=${q}${c.localPath}${q}`;
      return m;
    })
    .replace(/srcset=("|')([^"']+)\1/gi, (m, q, val) => {
      const newVal = val.split(',').map((part: string) => {
        const [u, descriptor] = part.trim().split(/\s+/, 2);
        const c = findCapturedFor(u, baseUrl);
        return [c?.localPath || u, descriptor].filter(Boolean).join(' ');
      }).join(', ');
      return `srcset=${q}${newVal}${q}`;
    })
    .replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, val) => {
      const c = findCapturedFor(val, baseUrl);
      if (c) return `url(${q}${c.localPath}${q})`;
      return m;
    });
  return htmlStr;
}

function rewriteCssContent(cssStr: string, baseUrl: string, cssLocalPath: string): string {
  return cssStr.replace(/url\((['"]?)([^'")]+)\1\)/gi, (m, q, v) => {
    if (v.startsWith('data:')) return m;
    const c = findCapturedFor(v, baseUrl);
    if (!c) return m;
    // Caminho relativo entre o arquivo CSS e o asset
    const fromDir = path.dirname(cssLocalPath);
    const rel = path.relative(fromDir, c.localPath).split(path.sep).join('/') || c.localPath;
    return `url(${q}${rel}${q})`;
  });
}

/**
 * Patch específico para Webpack/Vue 2 + bugs conhecidos:
 *  - Vue Router de mode:"history" → mode:"hash"
 *  - Webpack publicPath "/" → "" (relativo)
 *  - getJsonData(`/${t}/`) → getJsonData(t.replace(/^\/+|\/+$/g,''))
 *    e o template `/${t}/` vira `${t}` (remove barras extras)
 *  - Remove fbq/gtag chamadas para evitar erros
 */
function patchJsContent(jsStr: string): string {
  let out = jsStr;
  // Vue Router mode: history → hash
  out = out.replace(/mode\s*:\s*["']history["']/g, 'mode:"hash"');
  // Webpack publicPath: "/" → ""
  out = out.replace(/(\bt\.p\s*=\s*)"\/"/g, '$1""');
  out = out.replace(/(__webpack_require__\.p\s*=\s*)"\/"/g, '$1""');
  // Bug do trailing slash em fetch(`/${t}/`) → fetch(t)
  out = out.replace(/fetch\(\s*`\s*\/\$\{([a-zA-Z_$][a-zA-Z0-9_$]*)\}\/\s*`/g, 'fetch(String($1).replace(/^\\/+|\\/+$/g,""))');
  // Caso barra dupla acidental: /audio// → /audio/
  out = out.replace(/(["'`])\/{2,}/g, '$1/');
  // Stub de fbq/gtag para evitar ReferenceError
  if (/\bfbq\(/.test(out) || /\bgtag\(/.test(out)) {
    // não modifica, será injetado um stub global no HTML
  }
  return out;
}

// Aplica reescrita ao HTML principal
log('Reescrevendo HTML principal…');
html = rewriteHtmlContent(html, finalUrl);

// Injeta stubs/base/router-fix no HTML
const STUB = `
<!-- VSL Cloner standalone runtime -->
<script>
  (function(){
    // Stubs para analytics que foram removidos
    window.fbq = window.fbq || function(){};
    window.gtag = window.gtag || function(){};
    window.dataLayer = window.dataLayer || [];
    window._fbq = window._fbq || function(){};

    // Patch fetch global: remove trailing slash em paths que apontam para arquivos
    // (corrige o bug do funil onde getJsonData faz fetch('/' + t + '/'))
    var _origFetch = window.fetch;
    window.fetch = function(input, init){
      try {
        if (typeof input === 'string') {
          // Se termina com / mas tem extensão antes, remove a barra
          input = input.replace(/(\\.[a-zA-Z0-9]{2,5})\\/+$/, '$1');
          // Remove barras duplicadas
          input = input.replace(/([^:])\\/{2,}/g, '$1/');
        }
      } catch(e){}
      return _origFetch.call(this, input, init);
    };

    // Vue Router em hash: redireciona /v2 → /#/v2 quando carregado fora da raiz
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
html = html.replace(/<\/head>/i, STUB + '\n</head>');

// Adiciona <base> se necessário (não — usaremos paths relativos sempre).
// Salva index.html
await fs.writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf-8');

// Reescreve CSS, JS, JSON capturados (lottie/json não precisam reescrita)
log('Reescrevendo CSS e patchando JS chunks…');
for (const c of captured.values()) {
  if (c.type === 'css') {
    const txt = c.buf.toString('utf-8');
    c.buf = Buffer.from(rewriteCssContent(txt, c.url, c.localPath), 'utf-8');
  } else if (c.type === 'js') {
    const txt = c.buf.toString('utf-8');
    c.buf = Buffer.from(patchJsContent(txt), 'utf-8');
  }
}

// ─── 5. Salva arquivos ──────────────────────────────────────────────────────
log(`Gravando ${captured.size} arquivos em disco…`);
for (const c of captured.values()) {
  const full = path.join(OUT_DIR, c.localPath);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, c.buf);
}

// Manifest
const manifest = {
  sourceUrl: targetUrl,
  finalUrl,
  clonedAt: new Date().toISOString(),
  totalAssets: captured.size,
  totalBytes: [...captured.values()].reduce((s, e) => s + e.buf.length, 0),
  templates: templates.map((t) => t.template),
  assets: [...captured.values()].map((e) => ({
    url: e.url, localPath: e.localPath, type: e.type, size: e.buf.length,
  })),
};
await fs.writeFile(path.join(OUT_DIR, 'clone-manifest.json'), JSON.stringify(manifest, null, 2));

// README do pacote
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

Funciona em qualquer servidor estático (Nginx, S3, GitHub Pages,
Netlify, Vercel). Vue Router está em modo hash (#/), portanto a SPA
roda sem precisar de configuração de rewrite no servidor.
`
);

await browser.close();

// ─── 6. ZIP ─────────────────────────────────────────────────────────────────
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
await fs.writeFile(path.join(OUT_DIR, 'clone.zip'), zipBuf);
log(`clone.zip (${(zipBuf.length / 1024 / 1024).toFixed(2)} MB)`);

// ─── 7. Resumo ──────────────────────────────────────────────────────────────
const summary = [...captured.values()].reduce<Record<string, { n: number; bytes: number }>>(
  (acc, c) => {
    acc[c.type] = acc[c.type] || { n: 0, bytes: 0 };
    acc[c.type].n++;
    acc[c.type].bytes += c.buf.length;
    return acc;
  },
  {}
);
console.log('\n══════════════════════════════════════════════════════════');
console.log(' Clone concluído');
console.log('══════════════════════════════════════════════════════════');
console.log(` Pasta:  ${OUT_DIR}`);
console.log(` Total:  ${captured.size} arquivos / ${(manifest.totalBytes / 1024 / 1024).toFixed(2)} MB`);
console.log(` ZIP:    ${path.join(OUT_DIR, 'clone.zip')}`);
console.log(' Por tipo:');
for (const [k, v] of Object.entries(summary).sort()) {
  console.log(`   ${k.padEnd(10)} ${String(v.n).padStart(4)}  (${(v.bytes / 1024).toFixed(0)} KB)`);
}

// ─── 8. Servidor local + preview ────────────────────────────────────────────
if (!SHOW_PREVIEW) process.exit(0);

log(`Subindo servidor local em http://localhost:${PORT}/ …`);

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
    // Normaliza: remove query/hash, evita path traversal, remove trailing slash
    // (serve arquivo se existir, senão fallback para index.html — SPA)
    urlPath = urlPath.replace(/\/+$/, '') || '/';
    if (urlPath === '/') urlPath = '/index.html';
    const safe = path.normalize(urlPath).replace(/^([\\/])+/, '');
    const filePath = path.join(OUT_DIR, safe);
    if (!filePath.startsWith(OUT_DIR)) {
      res.statusCode = 403;
      res.end('Forbidden');
      return;
    }
    let buf: Buffer;
    let p = filePath;
    try {
      buf = await fs.readFile(p);
    } catch {
      // SPA fallback
      p = path.join(OUT_DIR, 'index.html');
      buf = await fs.readFile(p);
    }
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
  // Tenta abrir no navegador (best-effort)
  const opener =
    process.platform === 'darwin' ? 'open' :
    process.platform === 'win32'  ? 'start' :
    'xdg-open';
  try { spawn(opener, [u], { detached: true, stdio: 'ignore' }).unref(); } catch {}
});
