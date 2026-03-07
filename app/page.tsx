'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Home, Wallet, User as UserIcon, HelpCircle, Bell, Users, BookOpen, Briefcase } from 'lucide-react';

import LoginView from '@/components/LoginView';
import OnboardingView from '@/components/OnboardingView';
import DashboardView from '@/components/DashboardView';
import WalletView from '@/components/WalletView';
import ProfileView from '@/components/ProfileView';
import SupportView from '@/components/SupportView';
import CommunityView from '@/components/CommunityView';
import AcademyView from '@/components/AcademyView';
import MyJobsView from '@/components/MyJobsView';
import TaskSimulator from '@/components/TaskSimulator';
import UpsellModal from '@/components/UpsellModal';
import ToastNotification from '@/components/ToastNotification';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

export type UserProfile = {
  name: string;
  email: string;
  age: string;
  gender: string;
  experience: string;
  pixKey: string | null;
  level: 'Nacional Bronze' | 'Nacional Prata' | 'Nacional Ouro' | 'Global';
  tasksCompleted: number;
  tasksToday: number;
  lastTaskDate: string;
  isVerified: boolean;
  isPremium: boolean;
  isCommunityMember: boolean;
  createdAt: number;
  avatar?: string;
  completedModules: string[];
  history: { date: string, amount: number }[];
};

export type Mission = {
  id: string;
  category: string;
  type: 'ad' | 'chat' | 'qa' | 'input' | 'logic' | 'image' | 'dollar' | 'euro' | 'audit' | 'training' | 'transcription' | 'support' | 'video' | 'logistics';
  company: string;
  title: string;
  value: number;
  logo: string;
  completed: boolean;
  level: 1 | 2 | 3 | 4;
  currency: 'BRL' | 'USD' | 'EUR';
  duration: 'Rápido' | 'Médio' | 'Longo' | '15 min' | '20 min';
  description?: string;
  briefing?: {
    context: string;
    requirements: string[];
    rubric: { criterion: string; weight: number }[];
    estimatedTime: number;
  };
  steps?: {
    id: string;
    label: string;
    type: 'check' | 'input' | 'select';
    options?: string[];
    correctValue?: string | number;
    hint?: string;
  }[];
  evidence?: {
    type: 'text' | 'image' | 'mixed';
    minLength?: number;
    placeholder?: string;
  };
  data?: any;
};

export default function NextEnterprisePlatform() {
  const [view, setView] = useState<'login' | 'onboarding' | 'app'>('login');
  const [activeTab, setActiveTab] = useState<'home' | 'myjobs' | 'wallet' | 'community' | 'profile' | 'support' | 'academy'>('home');
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [balances, setBalances] = useState({ available: 0, analysis: 0, international: 0 });

  // Session Persistence
  useEffect(() => {
    const savedProfile = localStorage.getItem('hopro_profile');
    const savedBalances = localStorage.getItem('hopro_balances');
    
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setTimeout(() => {
          setProfile(parsed);
          setView('app');
        }, 0);
      } catch (e) {
        console.error('Failed to load profile', e);
      }
    }
    
    if (savedBalances) {
      try {
        const parsed = JSON.parse(savedBalances);
        setTimeout(() => setBalances(parsed), 0);
      } catch (e) {
        console.error('Failed to load balances', e);
      }
    }
  }, []);

  useEffect(() => {
    if (profile) {
      localStorage.setItem('hopro_profile', JSON.stringify(profile));
    }
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('hopro_balances', JSON.stringify(balances));
  }, [balances]);
  
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [showUpsell, setShowUpsell] = useState(false);
  const [toastMessage, setToastMessage] = useState<{title: string, message: string} | null>(null);

  // Applications State
  const [applications, setApplications] = useState<{ 
    mission: Mission, 
    status: 'not_applied' | 'applied_waiting_unlock' | 'unlocked' | 'in_progress_day_n' | 'completed' | 'blocked', 
    appliedAt?: number, 
    unlockAt?: number,
    unlockedNotified?: boolean
  }[]>([]);

  // Fake activity feed
  useEffect(() => {
    if (view !== 'app') return;
    
    const brazilianNames = [
      "Marcos Vinícius", "Ana Beatriz", "Cláudia Souza", "Ricardo Lima",
      "João Silva", "Maria Santos", "Pedro Costa", "Lucas Pereira", "Julia Rodrigues",
      "Gabriel Almeida", "Laura Carvalho", "Mateus Gomes", "Beatriz Martins", "Rafael Araújo",
      "Larissa Melo", "Thiago Ribeiro", "Camila Alves", "Bruno Barbosa", "Letícia Cardoso",
      "Gustavo Rocha", "Amanda Dias", "Felipe Castro", "Fernanda Fernandes", "Diego Pinto",
      "Carolina Moura", "Eduardo Cavalcanti", "Bruna Monteiro", "Leonardo Correia", "Juliana Lima",
      "Rodrigo Teixeira", "Vanessa Mendes", "Marcelo Vieira", "Aline Borges", "Guilherme Farias",
      "Patrícia Machado", "Henrique Barros", "Natália Moraes", "Caio Freitas", "Renata Nunes",
      "Vinícius Pires", "Mariana Duarte", "Daniel Ramos", "Isabela Moraes", "Alexandre Cunha",
      "Tatiana Viana", "Arthur Peixoto", "Priscila Rocha", "Vitor Nogueira", "Luana Batista",
      "Fernando Marques", "Sabrina Neves", "Igor Sales", "Bianca Reis", "Roberto Campos",
      "Thais Azevedo", "Leandro Aguiar", "Débora Moraes", "André Paiva", "Mônica Silveira",
      "Victor Dantas", "Cíntia Pires", "Samuel Fogaça", "Talita Guedes", "Tiago Assis",
      "Nayara Lemos", "Douglas Macedo", "Evelyn Viana", "Murilo Pacheco", "Gisele Franco",
      "Renato Brito", "Lívia Bentes", "Fábio Meireles", "Suelen Gusmão", "Anderson Lira",
      "Flávia Muniz", "Elias Sampaio", "Raquel Novaes", "Wesley Teles", "Paloma Barreto",
      "Márcio Valente", "Tainá Cordeiro", "Alex Goulart", "Lorena Pimenta", "Willian Bicalho",
      "Bárbara Leal", "Alan Furtado", "Milena Veloso", "Hugo Tavares", "Joana Diniz",
      "Wellington Maia", "Kelly Brandão", "Breno Lovato", "Joyce Camargo", "César Fontes",
      "Silvia Rangel", "Danilo Prado", "Mirian Lacerda", "Edson Xavier", "Teresa Pinho"
    ];
    
    const interval = setInterval(() => {
      const isJessica = Math.random() < 0.3; // 30% chance for Jessica
      
      let name, valueStr, status;
      if (isJessica) {
        name = "Jéssica O.";
        valueStr = "1.152,40";
        status = "Saque Aprovado (7º Dia)";
      } else {
        const fullName = brazilianNames[Math.floor(Math.random() * brazilianNames.length)];
        const parts = fullName.split(' ');
        name = `${parts[0]} ${parts[1][0]}.`;
        const value = (Math.random() * (2800 - 1000) + 1000).toFixed(2);
        valueStr = value.replace('.', ',');
        const statuses = ["Saque Aprovado (7º Dia)", "Auditoria Concluída", "PIX Liberado"];
        status = statuses[Math.floor(Math.random() * statuses.length)];
      }

      setToastMessage({
        title: `${name} - ${status}`,
        message: `R$ ${valueStr} transferido com sucesso.`
      });
      
      setTimeout(() => setToastMessage(null), 5000);
    }, Math.random() * (45000 - 20000) + 20000); // 20 to 45 seconds
    
    return () => clearInterval(interval);
  }, [view]);

  const handleLogin = () => {
    setView('onboarding');
  };

  const handleOnboardingComplete = (data: any) => {
    setProfile({
      ...data,
      pixKey: null,
      level: 'Nacional Bronze',
      tasksCompleted: 0,
      tasksToday: 0,
      lastTaskDate: new Date().toISOString().split('T')[0],
      isVerified: false, // Becomes true after 1st task
      isPremium: false,
      isCommunityMember: false,
      createdAt: Date.now(),
      completedModules: [],
      history: [],
    });
    setView('app');
    
    // Trigger first upsell after 3 seconds
    setTimeout(() => {
      setShowUpsell(true);
    }, 3000);
  };

  const handleTaskComplete = (mission: Mission) => {
    if (!profile) return;
    
    // Update balance
    const today = new Date().toISOString().split('T')[0];
    
    if (mission.currency === 'BRL') {
      setBalances(prev => ({ ...prev, analysis: prev.analysis + mission.value }));
    } else {
      setBalances(prev => ({ ...prev, international: prev.international + mission.value }));
    }
    
    // Update profile
    const newTasksCount = profile.tasksCompleted + 1;
    let newLevel = profile.level;
    
    if (newTasksCount >= 5 && profile.level === 'Nacional Bronze') newLevel = 'Nacional Prata';
    if (newTasksCount >= 15 && profile.level === 'Nacional Prata') newLevel = 'Nacional Ouro';
    
    const newTasksToday = profile.lastTaskDate === today ? profile.tasksToday + 1 : 1;

    setProfile(prev => {
      if (!prev) return null;
      
      // Update history
      const existingHistoryIndex = prev.history.findIndex(h => h.date === today);
      const newHistory = [...prev.history];
      
      if (existingHistoryIndex >= 0) {
        newHistory[existingHistoryIndex] = {
          ...newHistory[existingHistoryIndex],
          amount: newHistory[existingHistoryIndex].amount + (mission.currency === 'BRL' ? mission.value : 0)
        };
      } else {
        newHistory.push({ date: today, amount: mission.currency === 'BRL' ? mission.value : 0 });
      }

      return {
        ...prev,
        tasksCompleted: newTasksCount,
        tasksToday: newTasksToday,
        lastTaskDate: today,
        level: newLevel,
        isVerified: true,
        history: newHistory
      };
    });
    
    setActiveMission(null);
  };

  const handleUpgrade = () => {
    setProfile(prev => prev ? { ...prev, isPremium: true, level: 'Global' } : null);
    setShowUpsell(false);
  };

  const handleCompleteModule = (moduleId: string) => {
    if (!profile) return;
    
    setProfile(prev => {
      if (!prev) return null;
      return {
        ...prev,
        completedModules: [...(prev.completedModules || []), moduleId]
      };
    });
    
    setToastMessage({
      title: 'Módulo Concluído!',
      message: 'Você desbloqueou novas tarefas de alto valor.'
    });
    
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleApplyToJob = (mission: Mission) => {
    // Prevent duplicate applications
    if (applications.some(app => app.mission.id === mission.id)) {
      setToastMessage({
        title: 'Candidatura Já Enviada',
        message: 'Você já se candidatou a esta vaga. Verifique em "Trabalhos".'
      });
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const now = Date.now();
    setApplications(prev => [...prev, {
      mission,
      status: 'applied_waiting_unlock',
      appliedAt: now,
      unlockAt: now + 24 * 60 * 60 * 1000, // 24h
      unlockedNotified: false
    }]);
    
    setToastMessage({
      title: 'Candidatura confirmada',
      message: 'Volte amanhã; liberação em 24h.'
    });
  };

  if (view === 'login') return <LoginView onLogin={handleLogin} />;
  if (view === 'onboarding') return <OnboardingView onComplete={handleOnboardingComplete} />;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_100%)] text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Top Challenge Bar */}
      <div className="bg-blue-500/10 border-b border-blue-500/20 px-4 py-2 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.6)]" />
          <span className="text-xs font-bold text-blue-400 tracking-wider uppercase">Dia 1 de 7</span>
        </div>
        <span className="text-[10px] text-blue-400/80 font-medium">Complete para o Bônus de R$ 600</span>
      </div>

      {/* Main Content Area */}
      <main className="pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div key="home" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <DashboardView 
                balances={balances} 
                profile={profile!} 
                onOpenTask={setActiveMission}
                onApply={handleApplyToJob}
              />
            </motion.div>
          )}
          {activeTab === 'myjobs' && (
            <motion.div key="myjobs" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <MyJobsView 
                applications={applications}
                onOpenTask={setActiveMission}
              />
            </motion.div>
          )}
          {activeTab === 'wallet' && (
            <motion.div key="wallet" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <WalletView balances={balances} profile={profile!} />
            </motion.div>
          )}
          {activeTab === 'community' && (
            <motion.div key="community" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <CommunityView 
                profile={profile!} 
                onJoinCommunity={() => setProfile(prev => prev ? { ...prev, isCommunityMember: true } : null)}
              />
            </motion.div>
          )}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <ProfileView 
                profile={profile!} 
                onUpdateProfile={(updates) => setProfile(prev => prev ? { ...prev, ...updates } : null)}
              />
            </motion.div>
          )}
          {activeTab === 'support' && (
            <motion.div key="support" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <SupportView />
            </motion.div>
          )}
          {activeTab === 'academy' && (
            <motion.div key="academy" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <AcademyView 
                profile={profile!} 
                onCompleteModule={handleCompleteModule}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 glass-panel border-t border-white/10 px-6 py-4 z-40 pb-safe">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {[
            { id: 'home', icon: Home, label: 'Início' },
            { id: 'myjobs', icon: Briefcase, label: 'Trabalhos' },
            { id: 'wallet', icon: Wallet, label: 'Carteira' },
            { id: 'academy', icon: BookOpen, label: 'Academia' },
            { id: 'community', icon: Users, label: 'Comunidade' },
            { id: 'profile', icon: UserIcon, label: 'Perfil' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id ? 'text-blue-500' : 'text-slate-500 hover:text-slate-400'
              }`}
            >
              <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'fill-blue-500/20' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Modals & Overlays */}
      <AnimatePresence>
        {activeMission && (
          <TaskSimulator 
            mission={activeMission} 
            onClose={() => setActiveMission(null)} 
            onComplete={() => handleTaskComplete(activeMission)} 
          />
        )}
        
        {showUpsell && (
          <UpsellModal 
            onClose={() => setShowUpsell(false)} 
            onUpgrade={handleUpgrade} 
          />
        )}

        {toastMessage && (
          <ToastNotification 
            title={toastMessage.title} 
            message={toastMessage.message} 
          />
        )}

        <PWAInstallPrompt />
      </AnimatePresence>
    </div>
  );
}
