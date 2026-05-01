/**
 * VSL Extractor — server-side only
 * Parses a VSL page and extracts all relevant assets:
 * - Video players (ConvertAI, VTurb, SmartPlayer)
 * - .m3u8 manifests
 * - Poster/cover images
 * - Tracking scripts (Facebook Pixel, UTMify, Google Analytics)
 * - CTA delay configuration
 * - Checkout links
 * - Player IDs
 */

import type {
  ExtractedData,
  ExtractedAssets,
  PlayerData,
  TrackingData,
  CtaData,
  CheckoutData,
  PageData,
  CtaButton,
} from './supabase';

export interface ExtractionResult {
  data: ExtractedData;
  assets: ExtractedAssets;
  rawHtml: string;
  metadata: Record<string, unknown>;
}

// ─── Browser-like headers ─────────────────────────────────────────────────────

const BROWSER_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept:
    'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Cache-Control': 'max-age=0',
  'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  'sec-ch-ua-mobile': '?0',
  'sec-ch-ua-platform': '"Windows"',
};

// ─── URL normalization ────────────────────────────────────────────────────────

/**
 * Remove parâmetros de rastreamento (fbclid, utm_*, gclid, etc.) da URL.
 * Mantém parâmetros que fazem parte da lógica da página (ex: id=, v=, etc.)
 */
function removeTrackingParams(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = [
      'fbclid', 'gclid', 'msclkid', 'twclid', 'ttclid',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
      '_ga', '_gl', 'mc_cid', 'mc_eid',
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    return parsed.toString();
  } catch {
    return url;
  }
}

// ─── Fetch helpers ────────────────────────────────────────────────────────────

async function fetchWithHeaders(url: string, referer?: string): Promise<Response> {
  const headers: Record<string, string> = { ...BROWSER_HEADERS };
  if (referer) {
    headers['Referer'] = referer;
    headers['Sec-Fetch-Site'] = 'same-origin';
  } else {
    headers['Referer'] = 'https://www.google.com.br/';
  }

  return fetch(url, {
    headers,
    redirect: 'follow',
    signal: AbortSignal.timeout(25000),
  });
}

async function fetchPage(url: string): Promise<{ html: string; finalUrl: string }> {
  const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;

  // Attempt 1: URL original com headers de browser
  let response = await fetchWithHeaders(normalizedUrl);

  // Attempt 2: URL sem parâmetros de rastreamento (fbclid, utm_*, etc.)
  if (!response.ok && response.status === 403) {
    const cleanUrl = removeTrackingParams(normalizedUrl);
    if (cleanUrl !== normalizedUrl) {
      console.log(`[extractor] 403 com URL original, tentando sem tracking params: ${cleanUrl}`);
      response = await fetchWithHeaders(cleanUrl);
    }
  }

  // Attempt 3: URL sem NENHUM query param
  if (!response.ok && (response.status === 403 || response.status === 429)) {
    try {
      const parsed = new URL(normalizedUrl);
      const bareUrl = `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
      if (bareUrl !== normalizedUrl) {
        console.log(`[extractor] Ainda ${response.status}, tentando URL base: ${bareUrl}`);
        response = await fetchWithHeaders(bareUrl, parsed.origin);
      }
    } catch {
      // ignore
    }
  }

  if (!response.ok) {
    const status = response.status;
    if (status === 403) {
      throw new Error(
        `HTTP 403: Este site bloqueia acesso direto (proteção anti-bot). ` +
        `Tente usar a URL sem parâmetros de rastreamento (remova ?fbclid=... e similares) ` +
        `ou tente outra página do mesmo funil.`
      );
    }
    if (status === 404) {
      throw new Error(`HTTP 404: Página não encontrada. Verifique se a URL está correta.`);
    }
    if (status === 429) {
      throw new Error(`HTTP 429: Muitas requisições. Aguarde alguns minutos e tente novamente.`);
    }
    if (status === 500 || status === 502 || status === 503) {
      throw new Error(`HTTP ${status}: O servidor da página está com problemas. Tente novamente mais tarde.`);
    }
    throw new Error(`HTTP ${status}: ${response.statusText}`);
  }

  const html = await response.text();
  const finalUrl = response.url || normalizedUrl;
  return { html, finalUrl };
}

// ─── Player detection ─────────────────────────────────────────────────────────

function detectPlayer(html: string): PlayerData {
  const result: PlayerData = {
    type: 'unknown',
    organizationId: null,
    playerId: null,
    videoId: null,
    m3u8Urls: [],
    posterUrl: null,
    scriptSrc: null,
  };

  // ConvertAI detection
  const convertAiPatterns = [
    /convertai\.com\.br/i,
    /convertplayer/i,
    /convert-player/i,
    /cvt-player/i,
  ];
  if (convertAiPatterns.some((p) => p.test(html))) {
    result.type = 'convertai';

    const orgMatch =
      html.match(/organization[_-]?id['":\s]+['"]?([a-zA-Z0-9_-]+)/i) ||
      html.match(/org[_-]?id['":\s]+['"]?([a-zA-Z0-9_-]+)/i) ||
      html.match(/convertai\.com\.br\/([a-zA-Z0-9_-]+)\//i);
    if (orgMatch) result.organizationId = orgMatch[1];

    const playerMatch =
      html.match(/player[_-]?id['":\s]+['"]?([a-zA-Z0-9_-]+)/i) ||
      html.match(/data-player['":\s]+['"]?([a-zA-Z0-9_-]+)/i);
    if (playerMatch) result.playerId = playerMatch[1];

    const videoMatch =
      html.match(/video[_-]?id['":\s]+['"]?([a-zA-Z0-9_-]+)/i) ||
      html.match(/data-video['":\s]+['"]?([a-zA-Z0-9_-]+)/i);
    if (videoMatch) result.videoId = videoMatch[1];

    const scriptMatch = html.match(
      /src=['"]([^'"]*convertai[^'"]*\.js[^'"]*)['"]/i
    );
    if (scriptMatch) result.scriptSrc = scriptMatch[1];
  }

  // VTurb detection
  const vturbPatterns = [/vturb\.com/i, /vturb-player/i, /smartvsl/i, /vturb/i];
  if (!result.type || result.type === 'unknown') {
    if (vturbPatterns.some((p) => p.test(html))) {
      result.type = 'vturb';

      const vidMatch =
        html.match(/vid['":\s]+['"]?([a-zA-Z0-9_-]{8,})/i) ||
        html.match(/data-vid['":\s]+['"]?([a-zA-Z0-9_-]{8,})/i) ||
        html.match(/vturb\.com\/[^'"]*\/([a-zA-Z0-9_-]{8,})/i);
      if (vidMatch) result.videoId = vidMatch[1];

      const scriptMatch = html.match(/src=['"]([^'"]*vturb[^'"]*\.js[^'"]*)['"]/i);
      if (scriptMatch) result.scriptSrc = scriptMatch[1];
    }
  }

  // SmartPlayer detection
  const smartPlayerPatterns = [
    /smartplayer\.com\.br/i,
    /smart-player/i,
    /smartplayer/i,
  ];
  if (!result.type || result.type === 'unknown') {
    if (smartPlayerPatterns.some((p) => p.test(html))) {
      result.type = 'smartplayer';

      const playerMatch =
        html.match(/player[_-]?id['":\s]+['"]?([a-zA-Z0-9_-]+)/i) ||
        html.match(/data-id['":\s]+['"]?([a-zA-Z0-9_-]+)/i);
      if (playerMatch) result.playerId = playerMatch[1];

      const scriptMatch = html.match(
        /src=['"]([^'"]*smartplayer[^'"]*\.js[^'"]*)['"]/i
      );
      if (scriptMatch) result.scriptSrc = scriptMatch[1];
    }
  }

  return result;
}

// ─── M3U8 extraction ──────────────────────────────────────────────────────────

function extractM3u8Urls(html: string): string[] {
  const urls = new Set<string>();

  const directMatches = html.matchAll(/['"]([^'"]*\.m3u8[^'"]*)['"]/gi);
  for (const match of directMatches) {
    urls.add(match[1]);
  }

  const jsonMatches = html.matchAll(/\\u0022([^\\]*\.m3u8[^\\]*)\\u0022/gi);
  for (const match of jsonMatches) {
    urls.add(match[1]);
  }

  const encodedMatches = html.matchAll(/(['"])(https?%3A[^'"]*\.m3u8[^'"]*)\1/gi);
  for (const match of encodedMatches) {
    try {
      urls.add(decodeURIComponent(match[2]));
    } catch {
      urls.add(match[2]);
    }
  }

  return Array.from(urls).filter((url) => url.length > 10);
}

// ─── Poster image extraction ──────────────────────────────────────────────────

function extractPosterUrl(html: string): string | null {
  const patterns = [
    /poster=['"]([^'"]+)['"]/i,
    /data-poster=['"]([^'"]+)['"]/i,
    /cover[_-]?image['"\s:]+['"]([^'"]+)['"]/i,
    /thumbnail['"\s:]+['"]([^'"]+)['"]/i,
    /"poster":\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && !match[1].includes('undefined')) {
      return match[1];
    }
  }
  return null;
}

// ─── Tracking scripts ─────────────────────────────────────────────────────────

function extractTracking(html: string): TrackingData {
  const result: TrackingData = {
    facebookPixelId: null,
    utmify: false,
    googleAnalyticsId: null,
    rawScripts: [],
  };

  const fbPatterns = [
    /fbq\s*\(\s*['"]init['"]\s*,\s*['"](\d{10,20})['"]/i,
    /facebook[_-]?pixel[_-]?id['":\s]+['"]?(\d{10,20})/i,
    /_fbq\.push\(\['addPixelId',\s*['"](\d{10,20})['"]\]\)/i,
  ];
  for (const pattern of fbPatterns) {
    const match = html.match(pattern);
    if (match) {
      result.facebookPixelId = match[1];
      break;
    }
  }

  if (/utmify\.com\.br|utmify/i.test(html)) {
    result.utmify = true;
  }

  const gaPatterns = [
    /gtag\s*\(\s*['"]config['"]\s*,\s*['"]([GUA]-[A-Z0-9-]+)['"]/i,
    /ga\s*\(\s*['"]create['"]\s*,\s*['"]([UA]-\d+-\d+)['"]/i,
    /G-[A-Z0-9]{8,}/,
  ];
  for (const pattern of gaPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      result.googleAnalyticsId = match[1];
      break;
    }
    if (match && !match[1]) {
      const idMatch = html.match(/G-[A-Z0-9]{8,}/);
      if (idMatch) result.googleAnalyticsId = idMatch[0];
      break;
    }
  }

  const scriptMatches = html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi);
  for (const match of scriptMatches) {
    const content = match[1].trim();
    if (
      content.length > 20 &&
      (content.includes('fbq') ||
        content.includes('gtag') ||
        content.includes('utmify') ||
        content.includes('pixel'))
    ) {
      result.rawScripts.push(content.substring(0, 500));
    }
  }

  return result;
}

// ─── CTA detection ────────────────────────────────────────────────────────────

function extractCta(html: string): CtaData {
  const result: CtaData = {
    delay: null,
    delayParam: null,
    buttons: [],
  };

  const delayPatterns = [
    { regex: /scrollToActionIn\s*[=:]\s*(\d+)/i, param: 'scrollToActionIn' },
    { regex: /ctaDelay\s*[=:]\s*(\d+)/i, param: 'ctaDelay' },
    { regex: /cta[_-]?delay\s*[=:]\s*(\d+)/i, param: 'ctaDelay' },
    { regex: /showAfter\s*[=:]\s*(\d+)/i, param: 'showAfter' },
    { regex: /delay\s*[=:]\s*(\d+)/i, param: 'delay' },
    { regex: /setTimeout[^)]*,\s*(\d{4,6})\s*\)/i, param: 'setTimeout' },
  ];

  for (const { regex, param } of delayPatterns) {
    const match = html.match(regex);
    if (match) {
      result.delay = parseInt(match[1], 10);
      result.delayParam = param;
      break;
    }
  }

  const buttonPatterns = [
    /<a[^>]*href=['"]([^'"]*(?:checkout|comprar|buy|pedido|order|pay|pagar|oferta)[^'"]*)['"]/gi,
    /<button[^>]*onclick=['"][^'"]*(?:checkout|comprar|buy)[^'"]*['"]/gi,
  ];

  const buttons: CtaButton[] = [];
  for (const pattern of buttonPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const buttonHtml = html.substring(
          Math.max(0, html.indexOf(match[0])),
          html.indexOf(match[0]) + 500
        );
        const textMatch = buttonHtml.match(/>([^<]{3,80})</);
        buttons.push({
          text: textMatch ? textMatch[1].trim() : 'CTA Button',
          href: match[1],
          selector: 'a',
        });
      }
    }
  }

  result.buttons = buttons.slice(0, 5);
  return result;
}

// ─── Checkout links ───────────────────────────────────────────────────────────

function extractCheckout(html: string): CheckoutData {
  const checkoutPatterns = [
    /href=['"]([^'"]*(?:checkout|pay\.hotmart|app\.hotmart|go\.hotmart|pay\.kiwify|app\.kiwify|eduzz|monetizze|perfectpay|payt\.com\.br|ticto|greenn)[^'"]*)['"]/gi,
    /href=['"]([^'"]*(?:\/checkout|\/comprar|\/buy|\/order|\/pedido)[^'"]*)['"]/gi,
  ];

  const links = new Set<string>();

  for (const pattern of checkoutPatterns) {
    const matches = html.matchAll(pattern);
    for (const match of matches) {
      if (match[1] && match[1].startsWith('http')) {
        links.add(match[1]);
      }
    }
  }

  const linksArray = Array.from(links);
  return {
    links: linksArray,
    primaryLink: linksArray[0] || null,
  };
}

// ─── Page metadata ────────────────────────────────────────────────────────────

function extractPageData(html: string): PageData {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch =
    html.match(/<meta[^>]*name=['"]description['"][^>]*content=['"]([^'"]+)['"]/i) ||
    html.match(/<meta[^>]*content=['"]([^'"]+)['"][^>]*name=['"]description['"]/i);
  const ogImageMatch =
    html.match(/<meta[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]+)['"]/i) ||
    html.match(/<meta[^>]*content=['"]([^'"]+)['"][^>]*property=['"]og:image['"]/i);

  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);

  return {
    title: titleMatch ? titleMatch[1].trim() : null,
    description: descMatch ? descMatch[1].trim() : null,
    ogImage: ogImageMatch ? ogImageMatch[1] : null,
    headHtml: headMatch ? headMatch[1] : '',
    bodyHtml: bodyMatch ? bodyMatch[1] : html,
  };
}

// ─── Assets inventory ─────────────────────────────────────────────────────────

function extractAssets(html: string): ExtractedAssets {
  const m3u8Urls = extractM3u8Urls(html);

  const images = new Set<string>();
  const imgMatches = html.matchAll(/src=['"]([^'"]*\.(?:jpg|jpeg|png|gif|webp|svg)[^'"]*)['"]/gi);
  for (const match of imgMatches) {
    if (match[1].startsWith('http')) images.add(match[1]);
  }

  const scripts = new Set<string>();
  const scriptMatches = html.matchAll(/<script[^>]*src=['"]([^'"]+)['"]/gi);
  for (const match of scriptMatches) {
    if (match[1].startsWith('http')) scripts.add(match[1]);
  }

  const stylesheets = new Set<string>();
  const cssMatches = html.matchAll(/<link[^>]*href=['"]([^'"]*\.css[^'"]*)['"]/gi);
  for (const match of cssMatches) {
    if (match[1].startsWith('http')) stylesheets.add(match[1]);
  }

  return {
    m3u8Urls,
    images: Array.from(images).slice(0, 20),
    scripts: Array.from(scripts).slice(0, 30),
    stylesheets: Array.from(stylesheets).slice(0, 20),
  };
}

// ─── Main extractor ───────────────────────────────────────────────────────────

export async function extractVSL(url: string): Promise<ExtractionResult> {
  const { html: rawHtml, finalUrl } = await fetchPage(url);

  const player = detectPlayer(rawHtml);
  const m3u8Urls = extractM3u8Urls(rawHtml);
  player.m3u8Urls = m3u8Urls;
  player.posterUrl = extractPosterUrl(rawHtml);

  const tracking = extractTracking(rawHtml);
  const cta = extractCta(rawHtml);
  const checkout = extractCheckout(rawHtml);
  const page = extractPageData(rawHtml);
  const assets = extractAssets(rawHtml);

  const data: ExtractedData = {
    player,
    tracking,
    cta,
    checkout,
    page,
  };

  const metadata: Record<string, unknown> = {
    extractedAt: new Date().toISOString(),
    sourceUrl: url,
    finalUrl,
    htmlLength: rawHtml.length,
    playerDetected: player.type,
    m3u8Count: m3u8Urls.length,
    hasPixel: !!tracking.facebookPixelId,
    hasGA: !!tracking.googleAnalyticsId,
    hasUtmify: tracking.utmify,
    checkoutLinksCount: checkout.links.length,
  };

  return { data, assets, rawHtml, metadata };
}
