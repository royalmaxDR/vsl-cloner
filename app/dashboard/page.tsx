'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import type { Project } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import NewCloneModal from '@/components/NewCloneModal';
import {
  Plus,
  Zap,
  LogOut,
  Folder,
  ExternalLink,
  Trash2,
  Clock,
  Globe,
  BarChart3,
  RefreshCw,
  Download,
  Eye,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const res = await authFetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
    } else if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        window.location.href = '/login';
        return;
      }
      setUserEmail(session.user.email || '');
      fetchProjects();
    });
  }, [fetchProjects]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    setDeletingId(id);
    await authFetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  function handleProjectCreated(projectId: string) {
    setShowModal(false);
    router.push(`/editor/${projectId}`);
  }

  const stats = {
    total: projects.length,
    pronto: projects.filter((p) => p.status === 'pronto').length,
    publicado: projects.filter((p) => p.status === 'publicado').length,
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      <header className="relative border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-white">VSL Cloner</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-400 hidden sm:block">{userEmail}</span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition px-3 py-1.5 rounded-lg hover:bg-slate-800"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Clones</h1>
            <p className="text-slate-400 text-sm mt-1">
              Funis clonados — preview funcional e download ZIP
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchProjects}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title="Atualizar"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              <Plus className="w-4 h-4" />
              Novo Clone
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total', value: stats.total, icon: <Folder className="w-5 h-5 text-slate-400" />, color: 'border-slate-700' },
            { label: 'Prontos', value: stats.pronto, icon: <BarChart3 className="w-5 h-5 text-blue-400" />, color: 'border-blue-500/30' },
            { label: 'Publicados', value: stats.publicado, icon: <Globe className="w-5 h-5 text-green-400" />, color: 'border-green-500/30' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className={`glass-panel rounded-xl p-4 border ${color}`}>
              <div className="flex items-center justify-between mb-2">
                {icon}
                <span className="text-2xl font-bold text-white">{value}</span>
              </div>
              <p className="text-sm text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-panel rounded-2xl p-5 animate-pulse">
                <div className="h-5 bg-slate-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-slate-800 rounded w-full mb-2" />
                <div className="h-4 bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum clone ainda</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Crie seu primeiro clone colando a URL de um funil. O sistema baixa
              HTML, JS, CSS, imagens, áudios e vídeos automaticamente.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro clone
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onOpen={() => router.push(`/editor/${project.id}`)}
                onDelete={() => handleDelete(project.id)}
                isDeleting={deletingId === project.id}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewCloneModal
          onClose={() => setShowModal(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
  isDeleting,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  const cloneData = project.clone_data as
    | (Project['clone_data'] & { previewUrl?: string; zipUrl?: string })
    | null;
  const playerType = (project.extracted_data as { player?: { type?: string } } | null)?.player?.type;

  return (
    <div className="glass-panel rounded-2xl p-5 hover:border-slate-600 transition-all duration-200 group flex flex-col">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white truncate text-base">{project.name}</h3>
          <p className="text-xs text-slate-500 truncate mt-0.5">{project.source_url}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {playerType && playerType !== 'unknown' && (
          <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full capitalize">
            {playerType}
          </span>
        )}
        {cloneData?.stats && (
          <span className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
            {cloneData.stats.successAssets} assets
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
        <Clock className="w-3 h-3" />
        <span>{new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium py-2 rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          Abrir
        </button>

        {cloneData?.zipUrl && (
          <a
            href={cloneData.zipUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 text-sm font-medium py-2 px-3 rounded-lg transition border border-green-500/30"
            title="Baixar ZIP"
          >
            <Download className="w-3.5 h-3.5" />
          </a>
        )}

        {cloneData?.previewUrl && (
          <a
            href={cloneData.previewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-sm font-medium py-2 px-3 rounded-lg transition border border-blue-500/30"
            title="Abrir preview"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center justify-center p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
