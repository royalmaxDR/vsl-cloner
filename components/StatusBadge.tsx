import { Loader2, CheckCircle, Globe } from 'lucide-react';
import type { ProjectStatus } from '@/lib/supabase';

const config: Record<ProjectStatus, { label: string; className: string; icon: React.ReactNode }> = {
  extraindo: {
    label: 'Extraindo',
    className: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  pronto: {
    label: 'Pronto',
    className: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    icon: <CheckCircle className="w-3 h-3" />,
  },
  publicado: {
    label: 'Publicado',
    className: 'bg-green-500/15 text-green-400 border-green-500/30',
    icon: <Globe className="w-3 h-3" />,
  },
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const { label, className, icon } = config[status] ?? config.extraindo;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${className}`}
    >
      {icon}
      {label}
    </span>
  );
}
