import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Lock, CheckCircle2, ArrowRight, Briefcase, Calendar, AlertCircle, Play } from 'lucide-react';
import Image from 'next/image';
import { Mission } from '@/app/page';

import CompanyLogo from './CompanyLogo';

export default function MyJobsView({ 
  applications,
  onOpenTask 
}: { 
  applications: { 
    mission: Mission, 
    status: 'not_applied' | 'applied_waiting_unlock' | 'unlocked' | 'in_progress_day_n' | 'completed' | 'blocked', 
    appliedAt?: number, 
    unlockAt?: number,
    unlockedNotified?: boolean
  }[],
  onOpenTask: (mission: Mission) => void
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Meus Trabalhos</h1>
          <p className="text-sm text-gray-400">Gerencie suas candidaturas e contratos ativos.</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
          <Briefcase className="w-6 h-6 text-emerald-500" />
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="glass-panel rounded-3xl p-8 text-center border-white/5 flex flex-col items-center justify-center min-h-[300px]">
          <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-700">
            <Briefcase className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Nenhum Trabalho Ativo</h3>
          <p className="text-sm text-gray-400 max-w-xs mx-auto">
            Você ainda não se candidatou a nenhuma vaga. Vá para a aba &quot;Início&quot; e encontre oportunidades.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const isLocked = app.status === 'applied_waiting_unlock' && (app.unlockAt || 0) > now;
            const isUnlocked = app.status === 'applied_waiting_unlock' && (app.unlockAt || 0) <= now;
            
            return (
              <div 
                key={app.mission.id} 
                className={`glass-panel rounded-3xl p-5 transition-all relative overflow-hidden border-white/10`}
              >
                <div className="flex items-start gap-4 relative z-10">
                <CompanyLogo src={app.mission.logo} name={app.mission.company} size={56} />
                  <div className="flex-grow pt-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{app.mission.company}</span>
                      <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                        isLocked 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {isLocked ? 'EM ANÁLISE' : 'LIBERADO'}
                      </span>
                    </div>
                    <div className="font-bold text-white text-sm leading-tight mb-2">{app.mission.title}</div>
                    
                    {isLocked && app.unlockAt && (
                      <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 mb-3">
                        <Lock className="w-3 h-3" />
                        <span className="font-mono font-bold">Liberação em: {Math.max(0, Math.floor((app.unlockAt - now) / 1000 / 60))} min</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-5 border-t border-white/5 relative z-10">
                  <button 
                    onClick={() => isUnlocked && onOpenTask(app.mission)}
                    disabled={isLocked}
                    className={`w-full font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm ${
                      isLocked
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                    }`}
                  >
                    {isLocked ? (
                      <>
                        AGUARDANDO APROVAÇÃO
                        <Lock className="w-4 h-4" />
                      </>
                    ) : (
                      <>
                        INICIAR TRABALHO
                        <Play className="w-4 h-4 fill-current" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
