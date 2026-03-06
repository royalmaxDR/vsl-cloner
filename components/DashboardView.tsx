import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wallet, Clock, Lock, CheckCircle2, ArrowRight, Globe, Filter, Target, BookOpen, Briefcase, ShieldCheck, Wifi, UserCheck, FileText, Check } from 'lucide-react';
import Image from 'next/image';
import { UserProfile, Mission } from '@/app/page';
import { JOBS_DB } from '@/data/jobs';
import JobDetailsModal from './JobDetailsModal';

import CompanyLogo from './CompanyLogo';

export default function DashboardView({ 
  balances, 
  profile,
  onOpenTask,
  onApply
}: { 
  balances: { available: number, analysis: number, international: number },
  profile: UserProfile,
  onOpenTask: (mission: Mission) => void,
  onApply: (mission: Mission) => void
}) {
  const [loading, setLoading] = useState(true);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [selectedJob, setSelectedJob] = useState<Mission | null>(null);
  
  useEffect(() => {
    // Simulate loading jobs from DB
    setTimeout(() => {
      setMissions(JOBS_DB);
      setLoading(false);
    }, 1000);
  }, []);

  const tasksToday = profile.tasksToday;
  const tasksRemaining = Math.max(0, 5 - tasksToday);

  const [activeCategory, setActiveCategory] = useState<string>('Todas');
  const [durationFilter, setDurationFilter] = useState<string>('Todos');

  const categories = ['Todas', 'Iniciante', 'Especialista', 'Global'];
  const durations = ['Todos', 'Rápido', 'Médio', '10 min', '15 min'];

  const filteredMissions = missions.filter(m => {
    if (activeCategory !== 'Todas' && m.category !== activeCategory) return false;
    if (durationFilter !== 'Todos' && m.duration !== durationFilter) return false;
    return true;
  });

  const checkLockStatus = (mission: Mission) => {
    // Level Lock
    if (mission.category === 'Especialista' && profile.level === 'Nacional Bronze') return { locked: true, reason: 'Requer Nível Prata' };
    if (mission.category === 'Global' && !profile.isPremium) return { locked: true, reason: 'Acesso Global Bloqueado' };
    
    return { locked: false, reason: '' };
  };

  const dailyGoal = 10;
  const dailyProgress = Math.min((profile.tasksCompleted / dailyGoal) * 100, 100);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Carregando Vagas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-6">
      {/* User Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 tracking-tight drop-shadow-sm">Olá, {profile.name.split(' ')[0]}</h1>
          <p className="text-sm text-slate-400">Pronto para faturar hoje?</p>
        </div>
        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 p-0.5 shadow-lg shadow-blue-900/20">
          <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center overflow-hidden">
            <Image src={`https://picsum.photos/seed/${profile.name}/100/100`} alt="Avatar" width={48} height={48} />
          </div>
        </div>
      </div>

      {/* Daily Goal */}
      <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-xl">
        <div className="flex justify-between items-end mb-2">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            <span className="font-bold text-slate-100 text-sm">Sistema de Escala Ativo</span>
          </div>
          <span className="text-xs font-bold text-slate-400">{tasksToday} / 5</span>
        </div>
        <div className="w-full bg-slate-950/50 rounded-full h-2 mb-2 border border-white/5 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            style={{ width: `${(tasksToday / 5) * 100}%` }}
          />
        </div>
        <p className="text-[10px] text-slate-500 text-center uppercase tracking-wider font-bold">
          {tasksRemaining === 0 ? 'Limite diário atingido. Volte amanhã.' : 'Para garantir integridade, você recebe 5 vagas por dia.'}
        </p>
      </div>

      {/* Balance Cards */}
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden shadow-xl">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-2 text-blue-400 mb-2 relative z-10">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Disponível</span>
            </div>
            <div className="text-2xl font-bold text-slate-100 tracking-tight relative z-10 drop-shadow-md">
              R$ {balances.available.toFixed(2).replace('.', ',')}
            </div>
            <div className="text-[10px] text-slate-500 mt-1.5 font-medium relative z-10">Saque em 24h</div>
          </div>
          
          <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex flex-col justify-center relative overflow-hidden shadow-xl">
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-center gap-2 text-amber-400 mb-2 relative z-10">
              <Clock className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Em Análise</span>
            </div>
            <motion.div 
              key={balances.analysis}
              initial={{ scale: 1.1, color: '#FCD34D' }}
              animate={{ scale: 1, color: '#f1f5f9' }}
              className="text-2xl font-bold text-slate-100 tracking-tight relative z-10 drop-shadow-md"
            >
              R$ {balances.analysis.toFixed(2).replace('.', ',')}
            </motion.div>
            <div className="text-[10px] text-amber-400/60 mt-1.5 font-medium relative z-10">Sobe na hora</div>
          </div>
        </div>

        {/* International Balance */}
        <div className={`bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl p-5 flex items-center justify-between relative overflow-hidden shadow-xl ${profile.isPremium ? 'border-blue-500/30' : 'opacity-80'}`}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-transparent"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-blue-400 mb-1">
              <Globe className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Saldo Internacional</span>
            </div>
            <div className="text-xl font-bold text-slate-400 tracking-tight flex items-center gap-2">
              $ {balances.international.toFixed(2).replace('.', ',')} <span className="text-xs font-normal text-slate-600">(USD)</span>
            </div>
          </div>
          {!profile.isPremium && (
            <div className="w-10 h-10 rounded-full bg-slate-950/50 border border-white/10 flex items-center justify-center relative z-10">
              <Lock className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeCategory === cat 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                  : 'bg-slate-900/40 backdrop-blur-xl text-slate-400 hover:bg-slate-800/60 border border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
          <div className="flex items-center gap-1 text-slate-500 pl-1 pr-2">
            <Filter className="w-3 h-3" />
            <span className="text-[10px] font-bold uppercase">Tempo:</span>
          </div>
          {durations.map(dur => (
            <button
              key={dur}
              onClick={() => setDurationFilter(dur)}
              className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                durationFilter === dur 
                  ? 'bg-white/10 text-slate-100' 
                  : 'bg-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              {dur}
            </button>
          ))}
        </div>
      </div>

      {/* Mission Feed */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-100 tracking-tight drop-shadow-sm">
            Vagas Disponíveis para seu Perfil
          </h3>
          <span className="bg-slate-900/40 backdrop-blur-xl border border-white/10 text-slate-400 text-[10px] font-bold py-1 px-2.5 rounded-md uppercase tracking-wider">
            {profile.level}
          </span>
        </div>
        
        <div className="space-y-4">
          {tasksRemaining === 0 ? (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center shadow-xl">
              <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-100 mb-2">Limite Diário Atingido</h3>
              <p className="text-sm text-slate-400">
                Você completou todas as suas vagas de hoje. Novas oportunidades estarão disponíveis amanhã.
              </p>
            </div>
          ) : (
            filteredMissions.map((mission) => {
              const { locked, reason } = checkLockStatus(mission);
              
              return (
                <div 
                  key={mission.id} 
                  className={`bg-slate-900/40 backdrop-blur-xl border transition-all relative overflow-hidden rounded-3xl p-5 shadow-xl ${
                    mission.completed ? 'border-blue-500/20 opacity-60' : 
                    locked ? 'border-white/5' : 'border-white/10 hover:border-blue-500/30'
                  }`}
                >
                  {locked && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[4px] z-20 flex flex-col items-center justify-center">
                      <Lock className="w-8 h-8 text-amber-500 mb-2 drop-shadow-lg" />
                      <span className="text-xs font-bold text-white uppercase tracking-widest drop-shadow-md text-center px-4">
                        {reason}
                      </span>
                    </div>
                  )}

                  {/* Blur effect for Global tasks */}
                  {mission.category === 'Global' && locked && (
                    <div className="absolute inset-0 backdrop-blur-sm z-10" />
                  )}

                  <div className="flex items-start gap-4 relative z-10">
                    <CompanyLogo src={mission.logo} name={mission.company} size={56} />
                    <div className="flex-grow pt-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{mission.company}</span>
                        <span className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${
                          mission.category === 'Iniciante' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                          mission.category === 'Especialista' ? 'bg-blue-600/10 text-blue-300 border-blue-600/20' :
                          'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                        }`}>
                          {mission.category}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-950/50 text-slate-300 border border-white/10 flex items-center gap-1">
                          <Clock className="w-2 h-2" /> {mission.duration}
                        </span>
                      </div>
                      <div className="font-bold text-slate-100 text-sm leading-tight mb-2 drop-shadow-sm">{mission.title}</div>
                      <div className={`font-bold ${mission.currency !== 'BRL' ? 'text-blue-400' : 'text-blue-500'}`}>
                        {mission.currency === 'BRL' ? 'R$' : mission.currency === 'USD' ? '$' : '€'} {mission.value.toFixed(2).replace('.', ',')}
                      </div>
                    </div>
                  </div>
                  
                  {/* Requirements Section */}
                  {!mission.completed && !locked && (
                    <div className="mt-4 mb-4 space-y-2">
                      <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Requisitos Mínimos</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <ShieldCheck className="w-3 h-3 text-blue-500/70" />
                        <span>Leitura Analítica e Foco em Detalhes</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Wifi className="w-3 h-3 text-blue-500/70" />
                        <span>Dispositivo com Internet Estável</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <UserCheck className="w-3 h-3 text-blue-500/70" />
                        <span>Conformidade com Protocolos</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-5 pt-5 border-t border-white/5 relative z-10">
                    {mission.completed ? (
                      <div className="w-full py-3 flex items-center justify-center gap-2 text-blue-400 font-bold text-sm bg-blue-400/10 rounded-2xl border border-blue-400/20">
                        <CheckCircle2 className="w-4 h-4" />
                        VAGA PREENCHIDA
                      </div>
                    ) : (
                      <button 
                        onClick={() => setSelectedJob(mission)}
                        disabled={locked}
                        className={`w-full font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all text-sm shadow-lg ${
                          locked 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                        }`}
                      >
                        CANDIDATAR-SE À VAGA
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          
          {filteredMissions.length === 0 && tasksRemaining > 0 && (
            <div className="text-center py-10 text-gray-500 text-sm">
              Nenhuma vaga encontrada para estes filtros.
            </div>
          )}
        </div>
      </div>

      {/* Job Details Modal */}
      <AnimatePresence>
        {selectedJob && (
          <JobDetailsModal 
            mission={selectedJob} 
            onClose={() => setSelectedJob(null)} 
            onStart={() => {
              const job = selectedJob;
              onApply(job);
              setSelectedJob(null);
              // Small delay to allow modal exit animation to complete before opening simulator
              setTimeout(() => {
                onOpenTask(job);
              }, 400);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
