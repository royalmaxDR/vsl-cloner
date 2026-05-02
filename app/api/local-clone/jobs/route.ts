/**
 * GET /api/local-clone/jobs
 * Lista os jobs do motor local (em memória).
 */
import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-server';
import { listJobs } from '@/lib/local-clone-jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  const jobs = listJobs().map((j) => ({
    id: j.id,
    url: j.url,
    status: j.status,
    startedAt: j.startedAt,
    finishedAt: j.finishedAt,
    error: j.error,
    totalAssets: j.manifest?.totalAssets,
    totalBytes: j.manifest?.totalBytes,
  }));
  return NextResponse.json({ jobs });
}
