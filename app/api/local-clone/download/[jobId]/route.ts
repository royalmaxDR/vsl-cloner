/**
 * GET /api/local-clone/download/[jobId]
 * Devolve o `clone.zip` gerado pelo motor local.
 */
import { NextRequest } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { getJob } from '@/lib/local-clone-jobs';
import { getCurrentUser } from '@/lib/supabase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ jobId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { jobId } = await ctx.params;
  const job = getJob(jobId);
  if (!job) return new Response('Job não encontrado', { status: 404 });
  if (job.status !== 'done') {
    return new Response(`Clone ${job.status}; aguarde`, { status: 425 });
  }
  const zipPath = job.zipPath || path.join(job.outDir, 'clone.zip');
  try {
    const buf = await fs.readFile(zipPath);
    let host: string;
    try { host = new URL(job.url).hostname; } catch { host = 'clone'; }
    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${host}-${jobId}.zip"`,
        'Content-Length': String(buf.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('ZIP não encontrado', { status: 404 });
  }
}
