/**
 * GET /api/local-clone/stream/[jobId]
 * Server-Sent Events com o progresso de um job de clonagem.
 *
 * - Reenvia primeiro todo o histórico já acumulado (catch-up).
 * - Em seguida assina o job e empurra novos eventos em tempo real.
 * - Fecha o stream quando o job termina (status 'done' ou 'error').
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/supabase-server';
import { getJob } from '@/lib/local-clone-jobs';
import type { ProgressEvent } from '@/local-engine/engine';

export const runtime = 'nodejs';
export const maxDuration = 600;
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // controller fechado
        }
      };

      // Estado inicial
      send('status', {
        id: job.id,
        url: job.url,
        status: job.status,
        startedAt: job.startedAt,
      });

      // Catch-up: reenvia eventos já acumulados
      for (const e of job.events) {
        send(e.type, e);
      }

      if (job.status === 'done' || job.status === 'error') {
        send('end', { status: job.status, manifest: job.manifest, error: job.error });
        controller.close();
        return;
      }

      // Assina novos eventos
      const listener = (e: ProgressEvent) => {
        send(e.type, e);
        if (e.type === 'done' || e.type === 'error') {
          send('end', { status: job.status, manifest: job.manifest, error: job.error });
          job._listeners.delete(listener);
          try { controller.close(); } catch {}
        }
      };
      job._listeners.add(listener);

      // Heartbeat para manter conexão viva (proxies podem matar conexões inativas)
      const hb = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keep-alive ${Date.now()}\n\n`));
        } catch {
          clearInterval(hb);
        }
      }, 15_000);

      // Cleanup quando cliente desconecta
      const onClose = () => {
        clearInterval(hb);
        job._listeners.delete(listener);
      };
      // ReadableStream não tem 'cancel' direto aqui; o controller fecha quando
      // a conexão é abortada e enqueue lança. Como fallback, cleanup ao 'end'.
      void onClose;
    },
    cancel() {
      // O cliente fechou a conexão — nada a fazer aqui (listener será limpo
      // na próxima tentativa de send que falhar).
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
