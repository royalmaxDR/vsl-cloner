/**
 * POST /api/local-clone/start
 * Body: { url: string }
 * Inicia um clone com o motor local (Puppeteer). Roda em background;
 * o cliente acompanha o progresso via SSE em /api/local-clone/stream/:id.
 *
 * Requer usuário autenticado (Supabase). NÃO persiste no banco —
 * o motor local roda apenas no PC do usuário (next dev).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-server';
import { createJob } from '@/lib/local-clone-jobs';

export const runtime = 'nodejs';
// Durações longas: rodando local não há limite de Vercel.
export const maxDuration = 600;
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }
  const url = (body.url || '').trim();
  if (!url) return NextResponse.json({ error: 'Campo "url" obrigatório' }, { status: 400 });

  try {
    const job = createJob(url);
    return NextResponse.json({
      jobId: job.id,
      url: job.url,
      streamUrl: `/api/local-clone/stream/${job.id}`,
      previewUrl: `/api/local-clone/preview/${job.id}/`,
      downloadUrl: `/api/local-clone/download/${job.id}`,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Erro ao iniciar clone' },
      { status: 400 }
    );
  }
}
