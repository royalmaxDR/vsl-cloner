/**
 * Clone Engine — Motor de extração completa de funis.
 *
 * Recebe uma URL, busca a página renderizada (fetch+headers Chrome ou
 * fallback Puppeteer-core via @sparticuz/chromium-min), mapeia TODOS os
 * assets (JS, CSS, imagens, áudios, vídeos, fontes, JSON de animação),
 * baixa cada um, reescreve os caminhos para versão standalone, gera
 * um ZIP em memória pronto para download e devolve uma manifesto.
 *
 * Compatibilidade Vercel:
 *  - Modo `simple`: somente fetch (rápido, sem Chrome). Funciona em sites
 *    sem proteção pesada. ~10s típico em sites VSL.
 *  - Modo `browser`: usa puppeteer-core + chromium-min. Mais lento e pesa
 *    no cold-start, mas fura Cloudflare/SPAs.
 *
 * Para runtime Node.js (não Edge). Configure `export const runtime = 'nodejs'`
 * na route handler que usar este módulo.
 */
import * as cheerio from 'cheerio';
import JSZip from 'jszip';
import mime from 'mime-types';
import type { CloneAssetEntry, CloneData } from './supabase';

// ─── Constantes ─────────────────────────────────────────────────────────────

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124", "Not.A/Brand";v="99"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
  'Upgrade-Insecure-Requests': '1',
};

/** Limites para evitar travar serverless */
const MAX_ASSET_SIZE = 15 * 1024 * 1024; // 15 MB por asset
const MAX_TOTAL_SIZE = 80 * 1024 * 1024; // 80 MB total
const ASSET_TIMEOUT_MS = 15_000;
const FETCH_TIMEOUT_MS = 25_000;
const MAX_PARALLEL_DOWNLOADS = 8;
const MAX_ASSETS_PER_TYPE = 60;

export type CloneEngineMode = 'simple' | 'browser';

export interface CloneEngineOptions {
  mode?: CloneEngineMode;
  /** Limite de bytes total (default 80 MB) */
  maxTotalBytes?: number;
  /** Inclui assets de domínios externos (default true) */
  includeCrossOrigin?: boolean;
}

export interface CloneResult {
  cloneData: CloneData;
  /** ZIP do clone, pronto para download/upload. */
  zip: Uint8Array;
  /** HTML reescrito (também presente dentro do zip como index.html) */
  rewrittenHtml: string;
  /** Mapa nome→bytes dos arquivos do clone (para upload em storage) */
  files: Map<string, Uint8Array>;
  /** Cookies/avisos que indicam Cloudflare etc. */
  warnings: string[];
}

// ─── Detecção de Cloudflare ─────────────────────────────────────────────────

function looksLikeCloudflareBlock(html: string, status: number): boolean {
  if (status === 403 || status === 503) return true;
  const lower = html.toLowerCase().substring(0, 4000);
  return (
    lower.includes('cf-browser-verification') ||
    lower.includes('cf-challenge') ||
    lower.includes('attention required! | cloudflare') ||
    lower.includes('checking your browser') ||
    lower.includes('__cf_chl') ||
    lower.includes('just a moment...')
  );
}

// ─── Fetch da página ────────────────────────────────────────────────────────

async function fetchHtmlSimple(
  url: string
): Promise<{ html: string; finalUrl: string; status: number }> {
  const res = await fetch(url, {
    headers: { ...BROWSER_HEADERS, Referer: 'https://www.google.com/' },
    redirect: 'follow',
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  const html = await res.text();
  return { html, finalUrl: res.url || url, status: res.status };
}

async function fetchHtmlBrowser(
  url: string
): Promise<{ html: string; finalUrl: string; status: number }> {
  const { fetchPageWithBrowser } = await import('./browser-extractor');
  const r = await fetchPageWithBrowser(url);
  return { html: r.html, finalUrl: r.finalUrl, status: 200 };
}

// ─── Helpers de URL ─────────────────────────────────────────────────────────

function absolutize(href: string, baseUrl: string): string | null {
  if (!href) return null;
  if (href.startsWith('data:') || href.startsWith('blob:') || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return null;
  }
  try {
    return new URL(href, baseUrl).toString();
  } catch {
    return null;
  }
}

function classifyAsset(url: string, contentType?: string): CloneAssetEntry['type'] {
  const u = url.toLowerCase().split('?')[0];
  const ext = u.substring(u.lastIndexOf('.') + 1);
  const ct = (contentType || '').toLowerCase();

  if (ct.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif', 'ico'].includes(ext))
    return 'image';
  if (ct.startsWith('video/') || ['mp4', 'webm', 'mov', 'm4v'].includes(ext)) return 'video';
  if (ct.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext)) return 'audio';
  if (ct.includes('javascript') || ['js', 'mjs'].includes(ext)) return 'script';
  if (ct.includes('css') || ext === 'css') return 'stylesheet';
  if (['woff', 'woff2', 'ttf', 'otf', 'eot'].includes(ext) || ct.includes('font')) return 'font';
  if (ext === 'json' || ct.includes('json')) return 'json';
  return 'other';
}

function pathForAsset(url: string, type: CloneAssetEntry['type'], idx: number): string {
  const folders: Record<CloneAssetEntry['type'], string> = {
    image: 'assets/images',
    script: 'assets/js',
    stylesheet: 'assets/css',
    font: 'assets/fonts',
    video: 'assets/videos',
    audio: 'assets/audio',
    json: 'assets/data',
    other: 'assets/other',
  };
  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    pathname = url;
  }
  let base = pathname.split('/').pop() || `file-${idx}`;
  // Strip query
  base = base.split('?')[0].split('#')[0];
  if (!base.includes('.')) {
    // adicionar extensão pelo content-type/url
    const guessed = mime.extension(mime.lookup(url) || '') as string | false;
    if (guessed) base = `${base}.${guessed}`;
  }
  // Sanitiza
  base = base.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 80);
  // Hash curto pra evitar colisão
  const hash = (Math.abs(simpleHash(url)) % 9999).toString(36).padStart(3, '0');
  return `${folders[type]}/${hash}-${base}`;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h | 0;
}

// ─── Coleta de URLs do HTML ─────────────────────────────────────────────────

interface AssetCandidate {
  url: string;
  hint: CloneAssetEntry['type'];
}

function collectAssetCandidates(
  $: cheerio.CheerioAPI,
  baseUrl: string
): AssetCandidate[] {
  const seen = new Set<string>();
  const out: AssetCandidate[] = [];

  const push = (raw: string | undefined, hint: CloneAssetEntry['type']) => {
    if (!raw) return;
    const abs = absolutize(raw.trim(), baseUrl);
    if (!abs) return;
    if (seen.has(abs)) return;
    seen.add(abs);
    out.push({ url: abs, hint });
  };

  $('link[href]').each((_, el) => {
    const href = $(el).attr('href');
    const rel = ($(el).attr('rel') || '').toLowerCase();
    if (rel.includes('stylesheet')) push(href, 'stylesheet');
    else if (rel.includes('icon')) push(href, 'image');
    else if (rel.includes('preload') || rel.includes('prefetch')) {
      const as = ($(el).attr('as') || '').toLowerCase();
      if (as === 'font') push(href, 'font');
      else if (as === 'image') push(href, 'image');
      else if (as === 'script') push(href, 'script');
      else if (as === 'style') push(href, 'stylesheet');
      else push(href, 'other');
    } else {
      push(href, 'other');
    }
  });

  $('script[src]').each((_, el) => push($(el).attr('src'), 'script'));

  $('img').each((_, el) => {
    push($(el).attr('src'), 'image');
    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach((part) => {
        const u = part.trim().split(/\s+/)[0];
        push(u, 'image');
      });
    }
    push($(el).attr('data-src'), 'image');
  });

  $('source').each((_, el) => {
    push($(el).attr('src'), 'video');
    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach((part) => push(part.trim().split(/\s+/)[0], 'image'));
    }
  });

  $('video, audio').each((_, el) => {
    push($(el).attr('src'), $(el).prop('tagName')?.toLowerCase() === 'video' ? 'video' : 'audio');
    push($(el).attr('poster'), 'image');
  });

  $('[style]').each((_, el) => {
    const style = $(el).attr('style') || '';
    const matches = style.matchAll(/url\(['"]?([^'")]+)['"]?\)/gi);
    for (const m of matches) push(m[1], 'image');
  });

  // Inline CSS background-image refs
  $('style').each((_, el) => {
    const css = $(el).text();
    const matches = css.matchAll(/url\(['"]?([^'")]+)['"]?\)/gi);
    for (const m of matches) push(m[1], 'image');
  });

  // JSON refs (lottie etc)
  $('[data-lottie], [data-animation-path]').each((_, el) => {
    push($(el).attr('data-lottie'), 'json');
    push($(el).attr('data-animation-path'), 'json');
  });

  return out;
}

// ─── Download de assets ─────────────────────────────────────────────────────

async function downloadAsset(
  url: string,
  hint: CloneAssetEntry['type']
): Promise<{ buf: Uint8Array; contentType: string; type: CloneAssetEntry['type'] } | null> {
  try {
    const res = await fetch(url, {
      headers: { ...BROWSER_HEADERS },
      redirect: 'follow',
      signal: AbortSignal.timeout(ASSET_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    const len = parseInt(res.headers.get('content-length') || '0', 10);
    if (len > MAX_ASSET_SIZE) return null;
    const ab = await res.arrayBuffer();
    if (ab.byteLength > MAX_ASSET_SIZE) return null;
    const type = classifyAsset(url, ct) || hint;
    return { buf: new Uint8Array(ab), contentType: ct, type };
  } catch {
    return null;
  }
}

async function downloadInBatches<T, R>(
  items: T[],
  worker: (item: T, index: number) => Promise<R>,
  parallel: number
): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (cursor < items.length) {
      const i = cursor++;
      out[i] = await worker(items[i], i);
    }
  }
  const workers = Array.from({ length: Math.min(parallel, items.length) }, next);
  await Promise.all(workers);
  return out;
}

// ─── CSS rewriter: ajusta url(...) para paths locais ────────────────────────

function rewriteCssUrls(css: string, urlMap: Map<string, string>, cssBaseUrl: string): string {
  return css.replace(/url\((['"]?)([^'")]+)\1\)/gi, (_match, quote: string, raw: string) => {
    const abs = absolutize(raw.trim(), cssBaseUrl);
    if (!abs) return `url(${quote}${raw}${quote})`;
    const local = urlMap.get(abs);
    if (!local) return `url(${quote}${raw}${quote})`;
    // CSS está em assets/css/x.css → asset em assets/images/y.png → ../images/y.png
    return `url(${quote}../../${local}${quote})`;
  });
}

// ─── Motor principal ────────────────────────────────────────────────────────

export async function cloneSite(
  rawUrl: string,
  options: CloneEngineOptions = {}
): Promise<CloneResult> {
  const mode: CloneEngineMode = options.mode || 'simple';
  const warnings: string[] = [];

  // 1. Buscar HTML
  let html: string;
  let finalUrl: string;

  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;

  if (mode === 'simple') {
    const r = await fetchHtmlSimple(url);
    if (!r.html || looksLikeCloudflareBlock(r.html, r.status)) {
      warnings.push(
        'Cloudflare/anti-bot detectado neste site. Use o motor local (CLI Puppeteer) para um clone fiel.'
      );
      // Mesmo assim segue com o que conseguiu
    }
    html = r.html;
    finalUrl = r.finalUrl;
    if (!r.html) {
      throw new Error(`HTTP ${r.status}: não foi possível baixar o HTML`);
    }
  } else {
    const r = await fetchHtmlBrowser(url);
    html = r.html;
    finalUrl = r.finalUrl;
  }

  const $ = cheerio.load(html);

  // 2. Coletar candidatos
  let candidates = collectAssetCandidates($, finalUrl);

  // Limitar por tipo
  const byType: Record<string, AssetCandidate[]> = {};
  for (const c of candidates) {
    byType[c.hint] = byType[c.hint] || [];
    byType[c.hint].push(c);
  }
  candidates = Object.entries(byType).flatMap(([, arr]) =>
    arr.slice(0, MAX_ASSETS_PER_TYPE)
  );

  // 3. Baixar com limite de paralelismo
  const urlToLocalPath = new Map<string, string>();
  const assetEntries: CloneAssetEntry[] = [];
  const fileMap = new Map<string, Uint8Array>();
  let totalBytes = 0;
  const maxTotal = options.maxTotalBytes ?? MAX_TOTAL_SIZE;

  const downloaded = await downloadInBatches(
    candidates,
    async (c, idx) => {
      const r = await downloadAsset(c.url, c.hint);
      if (!r) {
        return { c, idx, err: 'Falha no download' as const };
      }
      return { c, idx, r };
    },
    MAX_PARALLEL_DOWNLOADS
  );

  for (const item of downloaded) {
    if ('err' in item) {
      assetEntries.push({
        url: item.c.url,
        localPath: '',
        type: item.c.hint,
        ok: false,
        error: item.err,
      });
      continue;
    }
    const { c, r, idx } = item;
    if (totalBytes + r.buf.byteLength > maxTotal) {
      assetEntries.push({
        url: c.url,
        localPath: '',
        type: r.type,
        ok: false,
        error: 'Limite total de bytes excedido',
      });
      continue;
    }
    const local = pathForAsset(c.url, r.type, idx);
    urlToLocalPath.set(c.url, local);
    fileMap.set(local, r.buf);
    totalBytes += r.buf.byteLength;
    assetEntries.push({
      url: c.url,
      localPath: local,
      type: r.type,
      size: r.buf.byteLength,
      contentType: r.contentType,
      ok: true,
    });
  }

  // 4. Reescrever CSS baixado (para apontar para imagens/fonts locais)
  for (const [localPath, buf] of fileMap.entries()) {
    if (!localPath.endsWith('.css')) continue;
    try {
      const css = new TextDecoder('utf-8').decode(buf);
      const rewritten = rewriteCssUrls(css, urlToLocalPath, finalUrl);
      fileMap.set(localPath, new TextEncoder().encode(rewritten));
    } catch {
      /* mantém original */
    }
  }

  // 5. Reescrever HTML
  // Substituir todos os atributos que apontem para URLs absolutas baixadas.
  const rewriteAttr = (selector: string, attr: string) => {
    $(selector).each((_, el) => {
      const v = $(el).attr(attr);
      if (!v) return;
      const abs = absolutize(v, finalUrl);
      if (!abs) return;
      const local = urlToLocalPath.get(abs);
      if (local) $(el).attr(attr, local);
    });
  };
  rewriteAttr('link[href]', 'href');
  rewriteAttr('script[src]', 'src');
  rewriteAttr('img', 'src');
  rewriteAttr('img', 'data-src');
  rewriteAttr('source', 'src');
  rewriteAttr('video', 'src');
  rewriteAttr('video', 'poster');
  rewriteAttr('audio', 'src');

  // srcset em imgs
  $('img[srcset], source[srcset]').each((_, el) => {
    const sv = $(el).attr('srcset');
    if (!sv) return;
    const newSv = sv
      .split(',')
      .map((part) => {
        const [u, descriptor] = part.trim().split(/\s+/, 2);
        const abs = absolutize(u, finalUrl);
        const local = abs ? urlToLocalPath.get(abs) : undefined;
        return [local || u, descriptor].filter(Boolean).join(' ');
      })
      .join(', ');
    $(el).attr('srcset', newSv);
  });

  // Inline style url(...)
  $('[style]').each((_, el) => {
    const sv = $(el).attr('style') || '';
    const newSv = sv.replace(/url\((['"]?)([^'")]+)\1\)/gi, (_m, q: string, raw: string) => {
      const abs = absolutize(raw, finalUrl);
      const local = abs ? urlToLocalPath.get(abs) : undefined;
      return `url(${q}${local || raw}${q})`;
    });
    if (newSv !== sv) $(el).attr('style', newSv);
  });

  // <style> tags
  $('style').each((_, el) => {
    const css = $(el).html() || '';
    const newCss = rewriteCssUrls(css, urlToLocalPath, finalUrl);
    if (newCss !== css) $(el).html(newCss);
  });

  // Adiciona <base> só na cópia online (preview), não no zip standalone.
  // Para o ZIP, deixamos sem <base>.
  const rewrittenHtml = $.html();
  fileMap.set('index.html', new TextEncoder().encode(rewrittenHtml));

  // Manifesto JSON dentro do zip
  const manifest = {
    sourceUrl: rawUrl,
    finalUrl,
    clonedAt: new Date().toISOString(),
    totalAssets: assetEntries.length,
    successAssets: assetEntries.filter((a) => a.ok).length,
    failedAssets: assetEntries.filter((a) => !a.ok).length,
    totalBytes,
    warnings,
    assets: assetEntries,
  };
  fileMap.set(
    'clone-manifest.json',
    new TextEncoder().encode(JSON.stringify(manifest, null, 2))
  );

  // README
  fileMap.set(
    'README.txt',
    new TextEncoder().encode(
      [
        'VSL Cloner — Pacote standalone',
        '',
        `Origem: ${rawUrl}`,
        `URL final: ${finalUrl}`,
        `Clonado em: ${new Date().toISOString()}`,
        `Assets: ${manifest.successAssets}/${manifest.totalAssets} (${(totalBytes / 1024).toFixed(1)} KB)`,
        '',
        'Como rodar localmente:',
        '  1. Extraia este ZIP em uma pasta',
        '  2. Em um terminal nessa pasta, rode: npx http-server -c-1',
        '  3. Acesse http://localhost:8080',
        '',
        warnings.length ? `Avisos:\n  - ${warnings.join('\n  - ')}` : '',
      ].join('\n')
    )
  );

  // 6. Construir ZIP
  const zip = new JSZip();
  for (const [name, buf] of fileMap.entries()) {
    zip.file(name, buf);
  }
  const zipBuf = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 7. CloneData (resposta para a UI)
  const cloneData: CloneData = {
    clonedAt: manifest.clonedAt,
    finalUrl,
    htmlLength: html.length,
    assets: assetEntries,
    stats: {
      totalAssets: manifest.totalAssets,
      successAssets: manifest.successAssets,
      failedAssets: manifest.failedAssets,
      totalBytes,
    },
    warnings,
    needsLocalEngine:
      warnings.some((w) => w.toLowerCase().includes('cloudflare')) ||
      manifest.successAssets === 0,
  };

  return { cloneData, zip: zipBuf, rewrittenHtml, files: fileMap, warnings };
}
