/**
 * GET /api/local-clone/preview/[jobId]
 * Atalho para o index.html do clone.
 */
import { NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getJob } from '@/lib/local-clone-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const { jobId } = await ctx.params;
  const job = getJob(jobId);
  if (!job) return new Response('Job não encontrado', { status: 404 });

  try {
    const buf = await fs.readFile(path.join(job.outDir, 'index.html'));
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new Response('Clone ainda não pronto', { status: 425 });
  }
}
