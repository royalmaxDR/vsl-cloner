/**
 * GET /api/local-clone/preview/[jobId]/[...path]
 * Serve os arquivos clonados como um servidor estático.
 *
 * - Se o caminho não existir, faz fallback para `index.html` (SPA).
 * - Headers permissivos (CORS, no-store) para que iframes de preview
 *   funcionem sem caching atrapalhar.
 *
 * Esta rota NÃO exige autenticação no path, mas o jobId é um token
 * aleatório (timestamp+rand) — quem não conhece o ID não consegue
 * acessar.
 */

import { NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getJob } from '@/lib/local-clone-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string; path?: string[] }> }
) {
  const { jobId, path: rest } = await ctx.params;
  const job = getJob(jobId);
  if (!job) return new Response('Job não encontrado', { status: 404 });

  const OUT_DIR = job.outDir;

  let urlPath = '/' + (rest || []).join('/');
  urlPath = urlPath.replace(/\/+$/, '') || '/';
  if (urlPath === '/') urlPath = '/index.html';

  const safe = path.normalize(urlPath).replace(/^([\\/])+/, '');
  const filePath = path.join(OUT_DIR, safe);
  if (!filePath.startsWith(OUT_DIR)) {
    return new Response('Forbidden', { status: 403 });
  }

  let buf: Buffer;
  let p = filePath;
  try {
    buf = await fs.readFile(p);
  } catch {
    // SPA fallback
    p = path.join(OUT_DIR, 'index.html');
    try {
      buf = await fs.readFile(p);
    } catch {
      return new Response('Not found (clone ainda em andamento?)', { status: 404 });
    }
  }
  const ext = path.extname(p).toLowerCase();
  return new Response(new Uint8Array(buf), {
    headers: {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
