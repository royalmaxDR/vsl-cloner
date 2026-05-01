'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import type { Project, ExtractedData, Customizations, PlayerData, TrackingData, CtaData, CheckoutData } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import {
  ArrowLeft,
  Save,
  Globe,
  Loader2,
  Zap,
  Video,
  Tag,
  ShoppingCart,
  BarChart3,
  Clock,
  CheckCircle,
  Copy,
  RefreshCw,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';

export default function EditorPage() {
  const params = useParams();
  const projectId = params.id as string;

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [reExtracting, setReExtracting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Customization state
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [facebookPixelId, setFacebookPixelId] = useState('');
  const [headlineText, setHeadlineText] = useState('');
  const [subheadlineText, setSubheadlineText] = useState('');
  const [ctaButtonText, setCtaButtonText] = useState('');

  const loadProject = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}`);
    if (!res.ok) {
      window.location.href = '/dashboard';
      return;
    }
    const data = await res.json();
    const p: Project = data.project;
    setProject(p);

    // Populate customization fields
    const custom = p.customizations as Customizations | null;
    const extracted = p.extracted_data as ExtractedData | null;

    setCheckoutUrl(custom?.checkoutUrl || extracted?.checkout?.primaryLink || '');
    setFacebookPixelId(custom?.facebookPixelId || extracted?.tracking?.facebookPixelId || '');
    setHeadlineText(custom?.headlineText || extracted?.page?.title || '');
    setSubheadlineText(custom?.subheadlineText || extracted?.page?.description || '');
    setCtaButtonText(custom?.ctaButtonText || extracted?.cta?.buttons?.[0]?.text || '');
    setPublishedUrl(p.published_url);
    setLoading(false);
  }, [projectId, router]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    const customizations: Customizations = {
      checkoutUrl: checkoutUrl || null,
      facebookPixelId: facebookPixelId || null,
      headlineText: headlineText || null,
      subheadlineText: subheadlineText || null,
      ctaButtonText: ctaButtonText || null,
      ctaButtonColor: null,
    };

    const res = await fetch(`/api/projects/${projectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customizations }),
    });

    if (res.ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } else {
      const d = await res.json();
      setError(d.error || 'Erro ao salvar');
    }
    setSaving(false);
  }

  async function handlePublish() {
    await handleSave();
    setPublishing(true);
    setError(null);

    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId }),
    });

    const data = await res.json();
    if (res.ok) {
      setPublishedUrl(data.publishedUrl);
      setProject((prev) => prev ? { ...prev, status: 'publicado', published_url: data.publishedUrl } : prev);
    } else {
      setError(data.error || 'Erro ao publicar');
    }
    setPublishing(false);
  }

  async function handleReExtract() {
    if (!project) return;
    setReExtracting(true);
    setError(null);

    const res = await fetch('/api/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: project.source_url, projectId }),
    });

    if (res.ok) {
      await loadProject();
    } else {
      const d = await res.json();
      setError(d.error || 'Erro na re-extração');
    }
    setReExtracting(false);
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-400">Carregando projeto...</p>
        </div>
      </div>
    );
  }

  if (!project) return null;

  const extracted = project.extracted_data as ExtractedData | null;
  const player = extracted?.player as PlayerData | null;
  const tracking = extracted?.tracking as TrackingData | null;
  const cta = extracted?.cta as CtaData | null;
  const checkout = extracted?.checkout as CheckoutData | null;

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => { window.location.href = '/dashboard'; }}
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
              onClick={handleReExtract}
              disabled={reExtracting}
              title="Re-extrair página"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${reExtracting ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium px-3 py-2 rounded-lg transition"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">{saveSuccess ? 'Salvo!' : 'Salvar'}</span>
            </button>

            <button
              onClick={handlePublish}
              disabled={publishing || !extracted}
              className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200"
            >
              {publishing ? (
                <><Loader2 className="w-4 h-4 animate-spin" /><span className="hidden sm:inline">Publicando...</span></>
              ) : (
                <><Globe className="w-4 h-4" /><span className="hidden sm:inline">Publicar</span></>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 flex items-start gap-3 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {publishedUrl && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-green-400 text-sm min-w-0">
              <Globe className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium">{publishedUrl}</span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => copyToClipboard(publishedUrl)}
                className="text-green-400 hover:text-green-300 transition p-1.5 rounded hover:bg-green-500/10"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <a
                href={publishedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-400 hover:text-green-300 transition p-1.5 rounded hover:bg-green-500/10"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Extraction report */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Ativos Extraídos
            </h2>

            {!extracted ? (
              <div className="glass-panel rounded-xl p-5 text-center">
                <AlertCircle className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">Extração ainda não realizada ou falhou.</p>
                <button
                  onClick={handleReExtract}
                  disabled={reExtracting}
                  className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition"
                >
                  Tentar novamente
                </button>
              </div>
            ) : (
              <>
                {/* Player card */}
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Video className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-semibold text-white">Player de Vídeo</h3>
                  </div>
                  {player ? (
                    <div className="space-y-2 text-xs">
                      <InfoRow label="Tipo" value={player.type} highlight />
                      {player.organizationId && <InfoRow label="Org ID" value={player.organizationId} mono />}
                      {player.playerId && <InfoRow label="Player ID" value={player.playerId} mono />}
                      {player.videoId && <InfoRow label="Video ID" value={player.videoId} mono />}
                      {player.m3u8Urls.length > 0 && (
                        <div>
                          <span className="text-slate-500">Manifests .m3u8:</span>
                          <div className="mt-1 space-y-1">
                            {player.m3u8Urls.slice(0, 3).map((url, i) => (
                              <div key={i} className="bg-slate-800 rounded px-2 py-1 font-mono text-slate-300 truncate">
                                {url.substring(0, 60)}...
                              </div>
                            ))}
                            {player.m3u8Urls.length > 3 && (
                              <span className="text-slate-500">+{player.m3u8Urls.length - 3} mais</span>
                            )}
                          </div>
                        </div>
                      )}
                      {player.posterUrl && (
                        <div>
                          <span className="text-slate-500">Poster:</span>
                          <img
                            src={player.posterUrl}
                            alt="poster"
                            className="mt-1 rounded w-full h-20 object-cover"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">Player não identificado</p>
                  )}
                </div>

                {/* Tracking card */}
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Rastreamento</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <InfoRow
                      label="Facebook Pixel"
                      value={tracking?.facebookPixelId || '—'}
                      mono={!!tracking?.facebookPixelId}
                    />
                    <InfoRow
                      label="Google Analytics"
                      value={tracking?.googleAnalyticsId || '—'}
                      mono={!!tracking?.googleAnalyticsId}
                    />
                    <InfoRow
                      label="UTMify"
                      value={tracking?.utmify ? 'Detectado' : 'Não detectado'}
                      highlight={tracking?.utmify}
                    />
                  </div>
                </div>

                {/* CTA card */}
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="w-4 h-4 text-yellow-400" />
                    <h3 className="text-sm font-semibold text-white">CTA</h3>
                  </div>
                  <div className="space-y-2 text-xs">
                    <InfoRow
                      label="Delay"
                      value={cta?.delay ? `${cta.delay}ms (${cta.delayParam})` : '—'}
                    />
                    <InfoRow
                      label="Botões encontrados"
                      value={String(cta?.buttons?.length || 0)}
                    />
                  </div>
                </div>

                {/* Checkout card */}
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShoppingCart className="w-4 h-4 text-green-400" />
                    <h3 className="text-sm font-semibold text-white">Checkout</h3>
                  </div>
                  <div className="space-y-1 text-xs">
                    {checkout?.links && checkout.links.length > 0 ? (
                      checkout.links.slice(0, 3).map((link, i) => (
                        <div key={i} className="bg-slate-800 rounded px-2 py-1 font-mono text-slate-300 truncate">
                          {link}
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-500">Nenhum link de checkout encontrado</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right: Editor */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">
              Personalizar Funil
            </h2>

            {/* Checkout section */}
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <ShoppingCart className="w-3.5 h-3.5 text-green-400" />
                </div>
                <h3 className="font-semibold text-white">Link de Checkout</h3>
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full">Obrigatório</span>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Substitua pelo seu link de checkout
                </label>
                <input
                  type="url"
                  value={checkoutUrl}
                  onChange={(e) => setCheckoutUrl(e.target.value)}
                  placeholder="https://pay.hotmart.com/seu-produto"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition font-mono text-sm"
                />
                {checkout?.primaryLink && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Original: <span className="font-mono">{checkout.primaryLink}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Tracking section */}
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white">Pixels de Rastreamento</h3>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1.5">
                  Facebook Pixel ID
                </label>
                <input
                  type="text"
                  value={facebookPixelId}
                  onChange={(e) => setFacebookPixelId(e.target.value)}
                  placeholder="Ex: 1234567890123456"
                  className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono text-sm"
                />
                {tracking?.facebookPixelId && (
                  <p className="text-xs text-slate-500 mt-1.5">
                    Original: <span className="font-mono">{tracking.facebookPixelId}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Texts section */}
            <div className="glass-panel rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Zap className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white">Textos da Página</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Título / Headline</label>
                  <input
                    type="text"
                    value={headlineText}
                    onChange={(e) => setHeadlineText(e.target.value)}
                    placeholder="Título principal da página"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Subtítulo / Subheadline</label>
                  <textarea
                    value={subheadlineText}
                    onChange={(e) => setSubheadlineText(e.target.value)}
                    placeholder="Descrição ou subtítulo"
                    rows={3}
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Texto do Botão CTA</label>
                  <input
                    type="text"
                    value={ctaButtonText}
                    onChange={(e) => setCtaButtonText(e.target.value)}
                    placeholder="Ex: QUERO COMPRAR AGORA"
                    className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Source URL info */}
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <ExternalLink className="w-4 h-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-300">URL de Origem</h3>
              </div>
              <a
                href={project.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition font-mono break-all"
              >
                {project.source_url}
              </a>
            </div>

            {/* Save button (bottom) */}
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saveSuccess ? 'Salvo com sucesso!' : 'Salvar alterações'}
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || !extracted}
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200"
              >
                {publishing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Publicando...</>
                ) : (
                  <><Globe className="w-4 h-4" />Publicar Funil</>
                )}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  highlight = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-slate-500 flex-shrink-0">{label}:</span>
      <span
        className={`text-right break-all ${
          mono ? 'font-mono text-slate-300' : ''
        } ${highlight ? 'text-purple-400 font-medium capitalize' : 'text-slate-300'}`}
      >
        {value}
      </span>
    </div>
  );
}
