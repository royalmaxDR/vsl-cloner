'use client';

import { useState } from 'react';
import { X, Loader2, Link as LinkIcon, FolderPlus } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreated: (projectId: string) => void;
}

export default function NewProjectModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create project
      const createRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), source_url: url.trim() }),
      });
      const createData = await createRes.json();
      if (!createRes.ok) throw new Error(createData.error || 'Erro ao criar projeto');

      const projectId = createData.project.id;

      // 2. Trigger extraction
      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), projectId }),
      });
      const extractData = await extractRes.json();
      if (!extractRes.ok) {
        // Extraction failed but project was created — still navigate to editor
        console.warn('Extraction warning:', extractData.error);
      }

      onCreated(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-panel rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <FolderPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-white">Novo Projeto VSL</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nome do projeto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Funil Produto X"
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              URL da página VSL
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                placeholder="https://dominio.com/pagina-vsl"
                className="w-full bg-slate-800/60 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">
              Cole a URL completa da página com o player de vídeo (ConvertAI, VTurb, SmartPlayer)
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          {loading && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl px-4 py-3">
              <div className="flex items-center gap-3 text-blue-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                <div>
                  <p className="font-medium">Extraindo ativos da página...</p>
                  <p className="text-xs text-blue-400/70 mt-0.5">
                    Identificando player, vídeos, pixels e links de checkout
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !url.trim()}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Extraindo...</>
              ) : (
                'Criar e Extrair'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
