'use client';

/**
 * Página /local-clone
 *
 * UI para o motor local (Puppeteer). Roda só no dev local do usuário
 * (next dev). O fluxo completo é:
 *   1. Cola URL → clica "Clonar"
 *   2. POST /api/local-clone/start cria o job
 *   3. EventSource em /api/local-clone/stream/:id mostra progresso
 *   4. Quando termina: iframe com preview + botão de download
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import {
  ArrowLeft, Zap, Link as LinkIcon, Play, Download, ExternalLink,
  Loader2, CheckCircle2, AlertCircle, FileAudio, FileVideo, FileCode,
  Image as ImageIcon, Type, FileJson, RefreshCw,
} from 'lucide-react';

type JobStatus = 'pending' | 'running' | 'done' | 'error';

interface ProgressLine {
  ts: number;
  text: string;
  level: 'info' | 'phase' | 'asset' | 'group' | 'error';
}

interface JobInfo {
  id: string;
  status: JobStatus;
  url: string;
  totalAssets: number;
  totalBytes: number;
  startedAt?: number;
  finishedAt?: number;
  manifest?: {
    totalAssets: number;
    totalBytes: number;
    byType: Record<string, { count: number; bytes: number }>;
    finalUrl: string;
  };
  error?: string;
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  audio: <FileAudio className="w-3.5 h-3.5" />,
  videos: <FileVideo className="w-3.5 h-3.5" />,
  images: <ImageIcon className="w-3.5 h-3.5" />,
  js: <FileCode className="w-3.5 h-3.5" />,
  css: <Type className="w-3.5 h-3.5" />,
  data: <FileJson className="w-3.5 h-3.5" />,
  legends: <Type className="w-3.5 h-3.5" />,
  fonts: <Type className="w-3.5 h-3.5" />,
  streams: <FileVideo className="w-3.5 h-3.5" />,
  other: <FileCode className="w-3.5 h-3.5" />,
};

export default function LocalClonePage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  const [url, setUrl] = useState('');
  const [job, setJob] = useState<JobInfo | null>(null);
  const [phasePct, setPhasePct] = useState(0);
  const [phaseName, setPhaseName] = useState('');
  const [lines, setLines] = useState<ProgressLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const esRef = useRef<EventSource | null>(null);

  // Auth gate (mesmo padrão do dashboard).
  // Em dev local, NEXT_PUBLIC_LOCAL_CLONE_NO_AUTH=1 pula o login.
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_LOCAL_CLONE_NO_AUTH === '1') {
      setUserEmail('local@dev');
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setUserEmail(session.user.email || '');
      setAuthLoading(false);
    });
  }, []);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [lines]);

  // Cleanup do EventSource
  useEffect(() => {
    return () => { esRef.current?.close(); };
  }, []);

  const pushLine = useCallback((text: string, level: ProgressLine['level'] = 'info') => {
    setLines((prev) => {
      const next = [...prev, { ts: Date.now(), text, level }];
      // Limita 400 linhas no DOM (motor pode emitir muito)
      if (next.length > 400) next.splice(0, next.length - 400);
      return next;
    });
  }, []);

  const subscribeStream = useCallback((jobId: string) => {
    esRef.current?.close();
    const es = new EventSource(`/api/local-clone/stream/${jobId}`);
    esRef.current = es;

    es.addEventListener('status', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      setJob((j) => ({
        id: data.id,
        status: data.status,
        url: data.url,
        totalAssets: j?.totalAssets || 0,
        totalBytes: j?.totalBytes || 0,
        startedAt: data.startedAt,
      }));
    });
    es.addEventListener('log', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      pushLine(data.message, 'info');
    });
    es.addEventListener('phase', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      setPhasePct(data.pct);
      setPhaseName(data.phase);
    });
    es.addEventListener('asset', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      setJob((j) => j ? { ...j, totalAssets: data.total, totalBytes: (j.totalBytes || 0) + (data.size || 0) } : j);
    });
    es.addEventListener('group', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      pushLine(`${data.template}: ${data.downloaded}/${data.total} baixados`, 'group');
    });
    es.addEventListener('done', (ev) => {
      const data = JSON.parse((ev as MessageEvent).data);
      setJob((j) => j ? { ...j, status: 'done', manifest: data.manifest, finishedAt: data.ts } : j);
      setPhasePct(100);
      setPhaseName('done');
      pushLine('✓ Clone concluído.', 'phase');
    });
    es.addEventListener('error', (ev) => {
      try {
        const data = JSON.parse((ev as MessageEvent).data);
        pushLine(`ERRO: ${data.message}`, 'error');
        setJob((j) => j ? { ...j, status: 'error', error: data.message } : j);
      } catch {
        // EventSource native error event — só fecha
      }
    });
    es.addEventListener('end', () => {
      es.close();
    });
    es.onerror = () => {
      // Conexão caiu inesperadamente
      // Não mostra erro se já terminou
    };
  }, [pushLine]);

  async function handleStart(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSubmitting(true);
    setLines([]);
    setPhasePct(0);
    setPhaseName('');
    setJob(null);
    try {
      const res = await authFetch('/api/local-clone/start', {
        method: 'POST',
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushLine(`Falha ao iniciar: ${data.error || res.status}`, 'error');
        setSubmitting(false);
        return;
      }
      setJob({
        id: data.jobId, status: 'running', url: data.url || url.trim(),
        totalAssets: 0, totalBytes: 0,
      });
      pushLine(`Job criado: ${data.jobId}`, 'phase');
      subscribeStream(data.jobId);
    } catch (err) {
      pushLine(err instanceof Error ? err.message : String(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  function handleReset() {
    esRef.current?.close();
    esRef.current = null;
    setJob(null);
    setLines([]);
    setPhasePct(0);
    setPhaseName('');
    setUrl('');
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
      </div>
    );
  }

  const isRunning = job && job.status === 'running';
  const isDone = job && job.status === 'done';
  const isError = job && job.status === 'error';
  const previewUrl = job ? `/api/local-clone/preview/${job.id}/` : '';
  const downloadUrl = job ? `/api/local-clone/download/${job.id}` : '';
  const elapsed = job?.startedAt
    ? Math.floor(((job.finishedAt || Date.now()) - job.startedAt) / 1000)
    : 0;

  return (
    <div className="min-h-screen bg-[#020617]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-slate-400 hover:text-white transition p-2 rounded-lg hover:bg-slate-800"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">VSL Cloner — Motor Local</span>
            <span className="hidden md:inline text-xs bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Roda no seu PC (Puppeteer)
            </span>
          </div>
          <div className="text-sm text-slate-400 hidden sm:block">{userEmail}</div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Clonar funil complexo</h1>
          <p className="text-slate-400 text-sm mt-1">
            Use Chrome real para passar Cloudflare, capturar áudios condicionais,
            animações Lottie, legendas VTT e gerar pacote standalone.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleStart} className="glass-panel rounded-2xl p-5 mb-6 border border-slate-800">
          <label className="block text-sm font-medium text-slate-300 mb-2">URL do funil</label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={!!isRunning || submitting}
                placeholder="https://testexamanico.misteriosdaalma.com/v2"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition disabled:opacity-50"
              />
            </div>
            {!job || isError ? (
              <button
                type="submit"
                disabled={submitting || !url.trim() || !!isRunning}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                Clonar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                disabled={!!isRunning}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-semibold px-5 py-3 rounded-xl transition"
              >
                <RefreshCw className="w-4 h-4" />
                Novo
              </button>
            )}
          </div>
        </form>

        {/* Progress + Stats */}
        {job && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="glass-panel rounded-2xl p-5 border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Progresso</h2>
                <StatusPill status={job.status} />
              </div>
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span>{phaseName ? `Fase: ${phaseName}` : 'Iniciando…'}</span>
                  <span>{phasePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isError ? 'bg-red-500' : isDone ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                    }`}
                    style={{ width: `${phasePct}%` }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center mt-4">
                <Stat label="Assets" value={String(job.manifest?.totalAssets || job.totalAssets || 0)} />
                <Stat label="MB" value={((job.manifest?.totalBytes || job.totalBytes || 0) / 1024 / 1024).toFixed(1)} />
                <Stat label="Tempo" value={`${elapsed}s`} />
              </div>

              {job.manifest?.byType && (
                <div className="mt-4 pt-4 border-t border-slate-800">
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Por tipo</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(job.manifest.byType).sort().map(([k, v]) => (
                      <span key={k} className="inline-flex items-center gap-1 text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-1 rounded-full">
                        {TYPE_ICONS[k] || TYPE_ICONS.other}
                        <span className="capitalize">{k}</span>
                        <span className="text-slate-500">{v.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {isDone && (
                <div className="mt-4 flex gap-2">
                  <a
                    href={downloadUrl}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 font-medium py-2.5 rounded-xl transition"
                  >
                    <Download className="w-4 h-4" />
                    Baixar ZIP
                  </a>
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 font-medium py-2.5 rounded-xl transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Abrir em nova aba
                  </a>
                </div>
              )}
              {isError && (
                <div className="mt-4 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-2.5 text-sm text-red-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{job.error}</span>
                </div>
              )}
            </div>

            {/* Log */}
            <div className="glass-panel rounded-2xl p-0 border border-slate-800 flex flex-col">
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
                <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Log do motor</h2>
                <span className="text-xs text-slate-500">{lines.length} linhas</span>
              </div>
              <div
                ref={logRef}
                className="flex-1 overflow-auto px-5 py-3 font-mono text-xs text-slate-300 bg-slate-950/50 max-h-[420px] min-h-[200px]"
              >
                {lines.length === 0 ? (
                  <div className="text-slate-600">Aguardando eventos…</div>
                ) : (
                  lines.map((l, i) => (
                    <div
                      key={i}
                      className={
                        l.level === 'error' ? 'text-red-400' :
                        l.level === 'phase' ? 'text-blue-300' :
                        l.level === 'group' ? 'text-purple-300' :
                        'text-slate-400'
                      }
                    >
                      {l.text}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Preview iframe */}
        {isDone && (
          <div className="glass-panel rounded-2xl p-0 border border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <h2 className="text-sm font-semibold text-white">Preview standalone</h2>
              </div>
              <span className="text-xs text-slate-500 font-mono truncate max-w-md">{previewUrl}</span>
            </div>
            <iframe
              src={previewUrl}
              className="w-full h-[700px] bg-white"
              sandbox="allow-scripts allow-forms allow-same-origin allow-popups allow-modals allow-presentation"
              title="Preview do clone"
            />
          </div>
        )}

        {!job && (
          <div className="glass-panel rounded-2xl p-6 border border-slate-800 text-sm text-slate-400">
            <p className="text-slate-300 font-medium mb-2">Como funciona</p>
            <ol className="list-decimal list-inside space-y-1.5">
              <li>Cole a URL do funil acima e clique em <span className="text-white">Clonar</span>.</li>
              <li>O motor abre um Chrome real (Puppeteer), passa pelo Cloudflare e captura HTML, CSS, JS, imagens, áudios MP3 condicionais, animações Lottie JSON, legendas VTT e streams m3u8.</li>
              <li>Os caminhos são reescritos para funcionar standalone (Vue Router em hash, paths relativos, fixes de bugs conhecidos).</li>
              <li>Quando terminar, você verá o preview funcional em iframe, e poderá baixar o ZIP completo.</li>
            </ol>
            <p className="mt-3 text-xs text-slate-500">
              Esta página exige Puppeteer instalado e roda só com <code className="text-slate-300">npm run dev</code> local — não em produção (Vercel).
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-800/40 rounded-lg py-2.5">
      <div className="text-lg font-semibold text-white">{value}</div>
      <div className="text-xs text-slate-500 uppercase tracking-wider">{label}</div>
    </div>
  );
}

function StatusPill({ status }: { status: JobStatus }) {
  const cfg: Record<JobStatus, { label: string; cls: string }> = {
    pending: { label: 'Pendente', cls: 'bg-slate-700 text-slate-300 border-slate-600' },
    running: { label: 'Em execução', cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
    done:    { label: 'Concluído',  cls: 'bg-green-500/15 text-green-400 border-green-500/30' },
    error:   { label: 'Erro',       cls: 'bg-red-500/15 text-red-400 border-red-500/30' },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1 text-xs border px-2 py-0.5 rounded-full ${c.cls}`}>
      {status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
      {status === 'done' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'error' && <AlertCircle className="w-3 h-3" />}
      {c.label}
    </span>
  );
}
