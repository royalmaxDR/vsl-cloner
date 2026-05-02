/**
 * Job manager em memória para os clones do motor local.
 *
 * Cada clone gera um `jobId`. O motor (engine.ts) roda em background,
 * empurrando ProgressEvents para um buffer ring por job. Os endpoints
 * SSE consomem desse buffer e fazem long-polling para novos eventos.
 *
 * Persistência: nenhuma. Reiniciar o `next dev` perde os jobs em
 * progresso. As pastas geradas em `local-engine/out/<jobId>` ficam,
 * porém, e podem ser servidas diretamente via /api/local-clone/preview.
 */

import path from 'node:path';
import { runClone, type ProgressEvent, type CloneManifest } from '../local-engine/engine';

export interface LocalCloneJob {
  id: string;
  url: string;
  outDir: string;
  status: 'pending' | 'running' | 'done' | 'error';
  startedAt: number;
  finishedAt?: number;
  events: ProgressEvent[];
  manifest?: CloneManifest;
  zipPath?: string;
  error?: string;
  /** Promise interna pra evitar GC do worker */
  _runner?: Promise<void>;
  _abort: AbortController;
  /** Listeners para SSE — recebem cada evento empurrado */
  _listeners: Set<(e: ProgressEvent) => void>;
}

declare global {
  // Mantemos os jobs num singleton global para sobreviver ao
  // hot-reload do Next.js em dev.
   
  var __vslLocalCloneJobs: Map<string, LocalCloneJob> | undefined;
}

const JOBS: Map<string, LocalCloneJob> =
  globalThis.__vslLocalCloneJobs || (globalThis.__vslLocalCloneJobs = new Map());

export function listJobs(): LocalCloneJob[] {
  return [...JOBS.values()].sort((a, b) => b.startedAt - a.startedAt);
}

export function getJob(id: string): LocalCloneJob | undefined {
  return JOBS.get(id);
}

function genId(): string {
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

export function createJob(url: string): LocalCloneJob {
  // Validação leve da URL
  let parsed: URL;
  try { parsed = new URL(url); } catch { throw new Error('URL inválida'); }
  if (!/^https?:$/.test(parsed.protocol)) throw new Error('URL precisa ser http ou https');

  const id = genId();
  const outDir = path.join(process.cwd(), 'local-engine', 'out', id);
  const job: LocalCloneJob = {
    id,
    url,
    outDir,
    status: 'pending',
    startedAt: Date.now(),
    events: [],
    _abort: new AbortController(),
    _listeners: new Set(),
  };
  JOBS.set(id, job);

  // Limita histórico: mantém só últimos 20 jobs
  if (JOBS.size > 20) {
    const sorted = [...JOBS.values()].sort((a, b) => a.startedAt - b.startedAt);
    while (JOBS.size > 20 && sorted.length) {
      const oldest = sorted.shift();
      if (oldest && oldest.status !== 'running') JOBS.delete(oldest.id);
    }
  }

  job._runner = (async () => {
    job.status = 'running';
    try {
      const result = await runClone({
        url,
        outDir,
        signal: job._abort.signal,
        onProgress: (e) => {
          job.events.push(e);
          // Mantém apenas últimos 500 eventos por job (evita memória infinita
          // em clones com milhares de assets).
          if (job.events.length > 500) job.events.splice(0, job.events.length - 500);
          for (const fn of job._listeners) {
            try { fn(e); } catch {}
          }
        },
      });
      job.manifest = result.manifest;
      job.zipPath = result.zipPath;
      job.status = 'done';
    } catch (err) {
      job.status = 'error';
      job.error = err instanceof Error ? err.message : String(err);
      const ev: ProgressEvent = { type: 'error', message: job.error, ts: Date.now() };
      job.events.push(ev);
      for (const fn of job._listeners) {
        try { fn(ev); } catch {}
      }
    } finally {
      job.finishedAt = Date.now();
    }
  })();

  return job;
}

export function abortJob(id: string): boolean {
  const j = JOBS.get(id);
  if (!j) return false;
  j._abort.abort();
  return true;
}
