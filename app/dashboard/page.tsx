'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { Project } from '@/lib/supabase';
import StatusBadge from '@/components/StatusBadge';
import NewProjectModal from '@/components/NewProjectModal';
import {
  Plus,
  Zap,
  LogOut,
  Folder,
  ExternalLink,
  Pencil,
  Trash2,
  Clock,
  Globe,
  BarChart3,
  RefreshCw,
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    const res = await fetch('/api/projects');
    if (res.ok) {
      const data = await res.json();
      setProjects(data.projects || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }
      setUserEmail(data.user.email || '');
    });
    fetchProjects();
  }, [fetchProjects, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
    setDeletingId(id);
    await fetch(`/api/projects/${id}`, { method: 'DELETE' });
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setDeletingId(null);
  }

  function handleProjectCreated(projectId: string) {
    setShowModal(false);
    fetchProjects();
    router.push(`/editor/${projectId}`);
  }

  const stats = {
    total: projects.length,
    pronto: projects.filter((p) => p.status === 'pronto').length,
    publicado: projects.filter((p) => p.status === 'publicado').length,
  };

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
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
        {/* Page title + actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Meus Projetos</h1>
            <p className="text-slate-400 text-sm mt-1">
              Gerencie seus funis VSL clonados
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
              Novo Projeto
            </button>
          </div>
        </div>

        {/* Stats */}
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

        {/* Projects list */}
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
            <h3 className="text-lg font-semibold text-white mb-2">Nenhum projeto ainda</h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              Crie seu primeiro projeto colando a URL de uma página VSL para começar a clonar.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              Criar primeiro projeto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={() => router.push(`/editor/${project.id}`)}
                onDelete={() => handleDelete(project.id)}
                isDeleting={deletingId === project.id}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={handleProjectCreated}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  isDeleting,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
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

      {playerType && playerType !== 'unknown' && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="text-xs bg-purple-500/15 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded-full capitalize">
            {playerType}
          </span>
        </div>
      )}

      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
        <Clock className="w-3 h-3" />
        <span>{new Date(project.created_at).toLocaleDateString('pt-BR')}</span>
      </div>

      <div className="mt-auto flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-medium py-2 rounded-lg transition"
        >
          <Pencil className="w-3.5 h-3.5" />
          Editar
        </button>

        {project.published_url && (
          <a
            href={project.published_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 bg-green-500/15 hover:bg-green-500/25 text-green-400 text-sm font-medium py-2 px-3 rounded-lg transition border border-green-500/30"
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
