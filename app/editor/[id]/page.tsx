'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import type {
  Project,
  ExtractedData,
  ExtractedAssets,
  CloneData,
} from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import {
  ArrowLeft,
  Loader2,
  Zap,
  AlertCircle,
  Search,
  Download,
  Eye,
  PackageOpen,
  Globe,
  RefreshCw,
  ExternalLink,
  Cloud,
  Cpu,
  CheckCircle2,
  XCircle,
  FileCode,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  Type,
} from 'lucide-react';

type ProjectWithClone = Project & {
  clone_data: (CloneData & { previewUrl?: string; zipUrl?: string }) | null;
};

interface AnalysisResult {
  success: boolean;
  url: string;
  data: ExtractedData;
  assets: ExtractedAssets;
  metadata: Record<string, unknown>;
}

export default function EditorPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<ProjectWithClone | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsLocalEngine, setNeedsLocalEngine] = useState(false);
  const [showLocalGuide, setShowLocalGuide] = useState(false);

  const loadProject = useCallback(async () => {
    setLoading(true);
    const res = await authFetch(`/api/projects/${projectId}`);
    if (!res.ok) {
      router.push('/dashboard');
      return;
    }
    const data = await res.json();
    setProject(data.project as ProjectWithClone);
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function handleAnalyze() {
    if (!project) return;
    setAnalyzing(true);
    setError(null);
    setNeedsLocalEngine(false);

    const res = await authFetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({ url: project.source_url }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Falha na análise');
      if (data.needsLocalEngine) setNeedsLocalEngine(true);
      setAnalyzing(false);
      return;
    }
    setAnalysis(data as AnalysisResult);
    setAnalyzing(false);
  }

  async function handleClone() {
    if (!project) return;
    setCloning(true);
    setError(null);

    const res = await authFetch('/api/clone', {
      method: 'POST',
      body: JSON.stringify({ projectId: project.id, mode: 'simple' }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Falha ao clonar');
      setCloning(false);
      return;
    }
    await loadProject();
    setCloning(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Carregando projeto…</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const cloneData = project.clone_data;

  return (
    <div className="min-h-screen bg-[#020617]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-slate-400 hover:text-white transition p-1.5 rounded-lg hover:bg-slate-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-semibold text-white truncate text-sm sm:text-base">{project.name}</h1>
            </div>
            <StatusBadge status={project.status} />
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={loadProject}
              title="Recarregar"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Source URL */}
        <div className="glass-panel rounded-xl p-4 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-500 mb-1">URL de origem</p>
            <a
              href={project.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-400 hover:text-blue-300 transition font-mono break-all"
            >
              {project.source_url}
            </a>
          </div>
          <a
            href={project.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {error && (
          <div className="glass-panel border border-red-500/30 bg-red-500/5 rounded-xl px-4 py-3 flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p>{error}</p>
              {needsLocalEngine && (
                <button
                  onClick={() => setShowLocalGuide(true)}
                  className="mt-2 text-xs text-orange-400 hover:text-orange-300 underline"
                >
                  Este site precisa do motor local. Ver instruções →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StepCard
            stepNum={1}
            title="Analisar"
            description="Inspeciona a URL e lista o que foi encontrado"
            done={!!analysis || !!cloneData}
            active={!analysis && !cloneData}
            icon={<Search className="w-5 h-5" />}
          />
          <StepCard
            stepNum={2}
            title="Clonar tudo"
            description="Baixa todos os assets e gera o pacote"
            done={!!cloneData}
            active={!!analysis && !cloneData}
            icon={<Download className="w-5 h-5" />}
          />
          <StepCard
            stepNum={3}
            title="Preview & ZIP"
            description="Visualize e baixe o clone funcional"
            done={!!cloneData?.previewUrl}
            active={!!cloneData}
            icon={<PackageOpen className="w-5 h-5" />}
          />
        </div>

        {/* Step 1: Análise */}
        {!cloneData && (
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-cyan-400" />
                  Análise da URL
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  Veja o que o sistema encontrou antes de baixar tudo.
                </p>
              </div>
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
              >
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Analisando…</>
                ) : (
                  <><Search className="w-4 h-4" />{analysis ? 'Re-analisar' : 'Analisar agora'}</>
                )}
              </button>
            </div>

            {analysis && (
              <AnalysisReport result={analysis} />
            )}

            {analysis && (
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleClone}
                  disabled={cloning}
                  className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-blue-500/20"
                >
                  {cloning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Clonando todos os assets…</>
                  ) : (
                    <><Download className="w-4 h-4" />Clonar tudo (motor Vercel)</>
                  )}
                </button>
                <button
                  onClick={() => setShowLocalGuide(true)}
                  className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-4 py-3 rounded-xl transition border border-slate-700"
                  title="Para sites com Cloudflare ou SPAs pesadas"
                >
                  <Cpu className="w-4 h-4" />
                  Usar motor local
                </button>
              </div>
            )}
          </section>
        )}

        {/* Step 3: Preview + ZIP */}
        {cloneData && (
          <section className="glass-panel rounded-2xl p-6">
            <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
              <div>
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <PackageOpen className="w-5 h-5 text-green-400" />
                  Clone gerado
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  {cloneData.stats.successAssets} de {cloneData.stats.totalAssets} assets ·{' '}
                  {(cloneData.stats.totalBytes / 1024 / 1024).toFixed(2)} MB ·{' '}
                  clonado em {new Date(cloneData.clonedAt).toLocaleString('pt-BR')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClone}
                  disabled={cloning}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-sm font-medium px-3 py-2 rounded-lg transition border border-slate-700"
                >
                  {cloning ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Re-clonando…</>
                  ) : (
                    <><RefreshCw className="w-4 h-4" />Re-clonar</>
                  )}
                </button>
                {cloneData.zipUrl && (
                  <a
                    href={cloneData.zipUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                  >
                    <Download className="w-4 h-4" />
                    Download ZIP
                  </a>
                )}
                {cloneData.previewUrl && (
                  <a
                    href={cloneData.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
                  >
                    <Globe className="w-4 h-4" />
                    Abrir preview
                  </a>
                )}
              </div>
            </div>

            {cloneData.warnings && cloneData.warnings.length > 0 && (
              <div className="mb-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3 text-yellow-400 text-sm">
                <p className="font-medium mb-1">Avisos do clone:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  {cloneData.warnings.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}

            {cloneData.previewUrl && (
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-black">
                <div className="bg-slate-900 px-3 py-2 flex items-center gap-2 text-xs text-slate-400 border-b border-slate-700">
                  <Eye className="w-3.5 h-3.5" />
                  Preview funcional (iframe servido a partir do Storage)
                </div>
                <iframe
                  src={cloneData.previewUrl}
                  className="w-full h-[600px] bg-white"
                  title="Preview do clone"
                  sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
                />
              </div>
            )}

            {/* Tabela de assets */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-3">Assets baixados</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {countByType(cloneData).map(({ type, count, ok, fail }) => (
                  <div key={type} className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                      {iconForType(type)}
                      <span className="capitalize">{type}</span>
                    </div>
                    <p className="text-xl font-semibold text-white">{count}</p>
                    <p className="text-xs text-slate-500">
                      <span className="text-green-400">{ok} ok</span>
                      {fail > 0 && <> · <span className="text-red-400">{fail} fail</span></>}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Cloning loading state */}
        {cloning && !cloneData && (
          <div className="glass-panel rounded-2xl p-8 text-center">
            <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-white font-medium">Clonando todos os assets…</p>
            <p className="text-slate-400 text-sm mt-1">
              Baixando JS, CSS, imagens, áudios e vídeos. Pode levar até 60 segundos.
            </p>
          </div>
        )}
      </main>

      {showLocalGuide && (
        <LocalEngineGuide
          projectId={projectId}
          onClose={() => setShowLocalGuide(false)}
        />
      )}
    </div>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function StepCard({
  stepNum,
  title,
  description,
  done,
  active,
  icon,
}: {
  stepNum: number;
  title: string;
  description: string;
  done: boolean;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div
      className={`glass-panel rounded-xl p-4 border ${
        done
          ? 'border-green-500/40 bg-green-500/5'
          : active
          ? 'border-blue-500/40 bg-blue-500/5'
          : 'border-slate-800'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            done
              ? 'bg-green-500/20 text-green-400'
              : active
              ? 'bg-blue-500/20 text-blue-400'
              : 'bg-slate-800 text-slate-500'
          }`}
        >
          {done ? <CheckCircle2 className="w-5 h-5" /> : icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-slate-500">Passo {stepNum}</p>
          <h3 className="font-semibold text-white text-sm">{title}</h3>
          <p className="text-xs text-slate-400 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
  );
}

function AnalysisReport({ result }: { result: AnalysisResult }) {
  const { data, assets } = result;
  const player = data.player;
  const tracking = data.tracking;
  const checkout = data.checkout;
  const page = data.page;

  return (
    <div className="space-y-4 mt-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Título da página</p>
          <p className="text-sm text-white font-medium">{page.title || '—'}</p>
          {page.description && (
            <p className="text-xs text-slate-400 mt-2 line-clamp-2">{page.description}</p>
          )}
        </div>
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-500 mb-1">Player de vídeo</p>
          <p className="text-sm text-white font-medium capitalize">{player?.type || 'não detectado'}</p>
          {player?.videoId && (
            <p className="text-xs text-slate-400 mt-1 font-mono">video: {player.videoId}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <AssetTile icon={<FileCode className="w-4 h-4" />} label="Scripts" count={assets.scripts.length} />
        <AssetTile icon={<Type className="w-4 h-4" />} label="CSS" count={assets.stylesheets.length} />
        <AssetTile icon={<ImageIcon className="w-4 h-4" />} label="Imagens" count={assets.images.length} />
        <AssetTile icon={<FileVideo className="w-4 h-4" />} label="m3u8" count={assets.m3u8Urls.length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <InfoLine label="Facebook Pixel" value={tracking.facebookPixelId || '—'} />
        <InfoLine label="Google Analytics" value={tracking.googleAnalyticsId || '—'} />
        <InfoLine label="UTMify" value={tracking.utmify ? 'detectado' : '—'} />
        <InfoLine label="Checkout" value={checkout.primaryLink || '—'} />
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/40 rounded-lg">
      <span className="text-xs text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-xs text-slate-300 font-mono truncate">{value}</span>
    </div>
  );
}

function AssetTile({
  icon,
  label,
  count,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
}) {
  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
        {icon}
        <span>{label}</span>
      </div>
      <p className="text-xl font-semibold text-white">{count}</p>
    </div>
  );
}

function countByType(cd: CloneData) {
  const map = new Map<string, { count: number; ok: number; fail: number }>();
  for (const a of cd.assets) {
    const cur = map.get(a.type) || { count: 0, ok: 0, fail: 0 };
    cur.count++;
    if (a.ok) cur.ok++;
    else cur.fail++;
    map.set(a.type, cur);
  }
  return Array.from(map.entries()).map(([type, v]) => ({ type, ...v }));
}

function iconForType(t: string) {
  switch (t) {
    case 'image':
      return <ImageIcon className="w-3.5 h-3.5" />;
    case 'video':
      return <FileVideo className="w-3.5 h-3.5" />;
    case 'audio':
      return <FileAudio className="w-3.5 h-3.5" />;
    case 'script':
      return <FileCode className="w-3.5 h-3.5" />;
    case 'stylesheet':
      return <Type className="w-3.5 h-3.5" />;
    case 'font':
      return <Type className="w-3.5 h-3.5" />;
    default:
      return <Cloud className="w-3.5 h-3.5" />;
  }
}

function LocalEngineGuide({ projectId, onClose }: { projectId: string; onClose: () => void }) {
  const [token, setToken] = useState<string>('');
  useEffect(() => {
    // Tenta ler o token da sessão Supabase
    import('@/lib/supabase').then(({ supabase }) => {
      supabase.auth.getSession().then(({ data }) => {
        setToken(data.session?.access_token || '');
      });
    });
  }, []);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oishenwcfeyucmtmysaa.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '<NEXT_PUBLIC_SUPABASE_ANON_KEY>';

  const cmd = `node clone-local.mjs <URL_DO_FUNIL> out/clone \\
  --upload \\
  --project-id=${projectId} \\
  --supabase-url=${supabaseUrl} \\
  --supabase-anon-key=${anonKey} \\
  --user-token=${token || '<seu-access_token>'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl glass-panel rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Cpu className="w-5 h-5 text-orange-400" />
            Motor local (Puppeteer full)
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 text-sm text-slate-300">
          <p>
            Para sites com <strong>Cloudflare</strong> ou SPAs pesadas, o motor da Vercel
            não consegue clonar tudo dentro do limite de 60 segundos. Use o motor local
            no seu próprio computador (precisa Node.js 18+).
          </p>
          <ol className="list-decimal list-inside space-y-2 pl-2">
            <li>
              Clone este repositório:{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">
                git clone https://github.com/royalmaxDR/vsl-cloner
              </code>
            </li>
            <li>
              Entre na pasta:{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">cd vsl-cloner/local-engine</code>
            </li>
            <li>
              Instale (uma única vez, ~170 MB):{' '}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-xs">npm install</code>
            </li>
            <li>
              Execute o clonador (ele já sobe o resultado para o seu painel):
            </li>
          </ol>
          <pre className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-300 overflow-x-auto">
            <code>{cmd}</code>
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(cmd)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            Copiar comando
          </button>
          <p className="text-xs text-slate-500">
            Quando terminar, clique em <strong>Recarregar</strong> nesta página para ver
            o preview e o ZIP.
          </p>
        </div>
      </div>
    </div>
  );
}
