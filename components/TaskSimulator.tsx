import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Shield, AlertTriangle, CheckCircle2, Clock, Terminal, Lock, FileText, ChevronRight, AlertOctagon, Ban, Check, Eye, MessageSquare, MoreHorizontal, UserCheck, Volume2, Layout, CreditCard, FileSearch, BarChart3, Scale, Star, Globe, Bot } from 'lucide-react';
import Image from 'next/image';
import { Mission } from '@/app/page';
import ChatSidebar from './ChatSidebar';
import { VideoTaskRenderer, LogisticsTaskRenderer, AudioTaskRenderer } from './TaskRenderers';

export default function TaskSimulator({ 
  mission, 
  onClose, 
  onComplete 
}: { 
  mission: Mission, 
  onClose: () => void, 
  onComplete: () => void 
}) {
  // Loading State
  const [loadingStep, setLoadingStep] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Task State
  const [timeLeft, setTimeLeft] = useState(300); // Default 5:00
  const [checklist, setChecklist] = useState<Record<string, boolean | null>>({});
  const [verdict, setVerdict] = useState<string | null>(null);
  const [userInput, setUserInput] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showError, setShowError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isAudioFinished, setIsAudioFinished] = useState(false);
  
  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [hasSentAttention, setHasSentAttention] = useState(false);
  const [audioData, setAudioData] = useState<string>('');
  const [logisticsData, setLogisticsData] = useState<any>(null);

  const taskData = mission.data || {};

  // Persistent Timer Logic
  useEffect(() => {
    const storageKey = `task_timer_${mission.id}`;
    const savedTime = localStorage.getItem(storageKey);
    const startTime = localStorage.getItem(`${storageKey}_start`);
    
    if (savedTime && startTime) {
      const elapsed = Math.floor((Date.now() - parseInt(startTime)) / 1000);
      const remaining = Math.max(parseInt(savedTime) - elapsed, 0);
      // Defer to avoid cascading render warning
      setTimeout(() => setTimeLeft(remaining), 0);
    } else {
      localStorage.setItem(storageKey, '300');
      localStorage.setItem(`${storageKey}_start`, Date.now().toString());
    }
  }, [mission.id]);

  // Update localStorage periodically
  useEffect(() => {
    if (isReady && timeLeft > 0) {
      const storageKey = `task_timer_${mission.id}`;
      localStorage.setItem(storageKey, timeLeft.toString());
      localStorage.setItem(`${storageKey}_start`, Date.now().toString());
    }
  }, [timeLeft, isReady, mission.id]);

  // Attention Message at 2 minutes (120 seconds elapsed, 180 left)
  useEffect(() => {
    if (isReady && timeLeft === 180 && !hasSentAttention) {
      const timer = setTimeout(() => {
        setIsChatOpen(true);
        setHasSentAttention(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isReady, timeLeft, hasSentAttention]);

  // Boot Sequence
  useEffect(() => {
    const steps = [
      { t: 0, s: 1 }, // Estabelecendo conexão
      { t: 1000, s: 2 }, // Carregando lote
      { t: 2500, s: 3 }, // Acesso liberado
      { t: 3000, s: 4 } // Ready
    ];

    steps.forEach(({ t, s }) => {
      setTimeout(() => {
        setLoadingStep(s);
        if (s === 4) setIsReady(true);
      }, t);
    });
  }, []);

  // Timer
  useEffect(() => {
    if (isReady && timeLeft > 0 && !showSuccess) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [isReady, timeLeft, showSuccess]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleChecklist = (key: string, value: boolean) => {
    setChecklist(prev => ({ ...prev, [key]: value }));
    setShowError(false);
  };

  const validateTask = () => {
    const title = mission.title;
    console.log(`[Supervisor] Iniciando auditoria da tarefa: ${title}`);
    
    try {
      let isCorrect = false;

      switch (mission.type) {
        case 'support':
          if (title === 'Supervisor de Atendimento') isCorrect = selectedOption === taskData.expectedScore;
          else if (title === 'International Support Lead') isCorrect = verdict === 'approve';
          else isCorrect = selectedOption === taskData.correctIndex;
          break;
        case 'ad':
          if (title === 'Gestor de Tráfego Pago') isCorrect = verdict === taskData.verdict;
          else if (title === 'Global Content Strategist') isCorrect = verdict === (taskData.isCorrect ? 'approve' : 'block');
          else isCorrect = verdict === 'block' || verdict === 'approve'; 
          break;
        case 'audit':
          if (title === 'Analista de Fraude Pleno') isCorrect = verdict === (taskData.isMatch ? 'approve' : 'block');
          else if (title === 'Auditor de Compliance') isCorrect = verdict === (taskData.isViolation ? 'block' : 'approve');
          else if (title === 'Senior Data Analyst') isCorrect = userInput.toLowerCase().includes(taskData.expectedConclusion.toLowerCase());
          else isCorrect = userInput.includes(taskData.expectedValue) || userInput.includes(taskData.expectedCnpj);
          break;
        case 'training':
          if (title === 'Treinador de Algoritmos') isCorrect = verdict === taskData.bestResponse;
          else if (title === 'AI Ethics Officer') isCorrect = verdict === (taskData.isBiased ? 'block' : 'approve');
          else isCorrect = verdict === 'approve';
          break;
        case 'qa':
          isCorrect = selectedOption === taskData.failStep;
          break;
        case 'transcription':
          isCorrect = audioData.trim().toLowerCase() === taskData.expectedText?.toLowerCase();
          break;
        case 'video':
          if (title === 'Moderador de Conteúdo Sênior') isCorrect = verdict === taskData.verdict;
          else isCorrect = verdict === 'block';
          break;
        case 'logistics':
          if (!logisticsData) isCorrect = false;
          else {
            const cleanCnpj = logisticsData.cnpj?.replace(/\D/g, '');
            const expectedCnpj = taskData.nfe.cnpj.replace(/\D/g, '');
            isCorrect = logisticsData.totalValue === taskData.nfe.totalValue && 
                        logisticsData.issueDate === taskData.nfe.issueDate &&
                        cleanCnpj === expectedCnpj;
          }
          break;
        default:
          isCorrect = true;
      }

      if (isCorrect) {
        console.log(`[Supervisor] Tarefa APROVADA. Qualidade: 100%.`);
      } else {
        console.warn(`[Supervisor] Tarefa REPROVADA. Divergência de dados detectada.`);
      }

      return isCorrect;
    } catch (err) {
      console.error('[Supervisor] Erro crítico na validação:', err);
      return false;
    }
  };

  const canSubmit = () => {
    // Strict 5-minute lock (300s) - only allow submit after timer reaches 0
    if (timeLeft > 0) return false; 
    
    // Audio task requires audio to be finished
    if (mission.type === 'transcription' && !isAudioFinished) return false;

    switch (mission.type) {
      case 'support': return selectedOption !== null || verdict !== null;
      case 'ad': return verdict !== null;
      case 'audit': return verdict !== null || userInput.length > 5;
      case 'training': return verdict !== null;
      case 'transcription': return audioData.length > 10;
      case 'video': return verdict !== null;
      case 'logistics': return logisticsData !== null && logisticsData.cnpj?.length >= 14;
      case 'qa': return selectedOption !== null;
      default: return verdict !== null;
    }
  };

  const submitAudit = async () => {
    if (isSubmitting) return;

    try {
      if (!validateTask()) {
        setShowError(true);
        return;
      }
      
      setIsSubmitting(true);
      
      // Simulate server processing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Clear timer from storage on success
      localStorage.removeItem(`task_timer_${mission.id}`);
      localStorage.removeItem(`task_timer_${mission.id}_start`);
      
      setIsSubmitting(false);
      setShowSuccess(true);
      
      setTimeout(onComplete, 2000);
    } catch (err) {
      console.error('Erro ao enviar tarefa:', err);
      setIsSubmitting(false);
      alert('Ocorreu um erro ao processar sua tarefa. Por favor, tente novamente.');
    }
  };

  // Render Loading Screen
  if (!isReady) {
    return (
      <div className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_100%)] flex flex-col items-center justify-center font-mono text-blue-500 p-4">
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center gap-2 mb-8">
            <Terminal className="w-6 h-6" />
            <span className="text-xl font-bold tracking-wider text-slate-100 drop-shadow-md">NEXT_ENTERPRISE_OS v2.1.0</span>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">{'>'}</span>
              <span className={loadingStep >= 1 ? 'opacity-100 text-slate-300' : 'opacity-0'}>
                Estabelecendo conexão segura com servidor...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">{'>'}</span>
              <span className={loadingStep >= 2 ? 'opacity-100 text-slate-300' : 'opacity-0'}>
                Carregando lote de tarefas #{mission.id.split('-')[1]}...
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">{'>'}</span>
              <span className={loadingStep >= 3 ? 'text-blue-400 font-bold opacity-100' : 'opacity-0'}>
                ACESSO LIBERADO
              </span>
            </div>
          </div>

          <div className="h-1 w-full bg-slate-900/50 rounded-full overflow-hidden mt-8 border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 bg-[radial-gradient(circle_at_top,_#0f172a_0%,_#020617_100%)] text-slate-200 font-sans flex flex-col overflow-hidden"
    >
      {/* Header */}
      <header className="h-14 border-b border-white/10 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 relative z-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-blue-500">
            <Shield className="w-5 h-5" />
            <span className="font-mono font-bold tracking-wider hidden sm:inline text-slate-100">NEXT ENTERPRISE</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>TAREFA:</span>
            <span className="text-slate-100">#{mission.id.split('-')[1]}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 font-mono text-sm px-3 py-1 rounded border ${
            timeLeft <= 240 ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            <Clock className="w-4 h-4" />
            <span>{formatTime(timeLeft)}</span>
          </div>
          
          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`p-2 rounded-lg transition-all relative ${isChatOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'hover:bg-white/5 text-slate-400'}`}
          >
            <MessageSquare className="w-5 h-5" />
            {!isChatOpen && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-slate-900" />}
          </button>

          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Main Content - Split Screen */}
      <main className="flex-grow flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden relative">
        
        {/* Chat Sidebar */}
        <ChatSidebar 
          supervisorName="Isabela (Supervisor)" 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          initialMessage={taskData.initialChatMessage}
        />

        {/* Left Panel - Task Content */}
        <div className="w-full lg:w-1/2 p-4 lg:p-6 flex flex-col border-b lg:border-b-0 lg:border-r border-white/10 bg-slate-900/20 backdrop-blur-sm relative z-0 min-h-[400px] lg:min-h-0 lg:overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-500" />
              Objeto de Análise
            </h3>
            <span className="text-[10px] font-mono bg-slate-950/50 text-slate-400 px-2 py-1 rounded border border-white/5">
              {mission.type.toUpperCase()}_CONTENT_{mission.id.split('-')[1]}
            </span>
          </div>

          <div className="relative w-full aspect-square sm:aspect-video lg:aspect-auto lg:flex-grow bg-slate-950/50 rounded-2xl border border-white/10 overflow-hidden group flex flex-col shadow-inner">
            {mission.title === 'Analista de Fraude Pleno' ? (
              <div className="p-4 grid grid-cols-2 gap-4 h-full">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Cartão de Crédito</span>
                  <div className="flex-grow bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 p-6 flex flex-col justify-center gap-4 shadow-lg">
                    <CreditCard className="w-8 h-8 text-blue-500/50" />
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500">NOME NO CARTÃO</div>
                      <div className="text-sm font-mono font-bold text-slate-100">{taskData.cardName}</div>
                    </div>
                    <div className="text-xs font-mono text-slate-600">**** **** **** 8821</div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase text-slate-500 font-bold">Documento (RG)</span>
                  <div className="flex-grow bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 p-6 flex flex-col justify-center gap-4 shadow-lg">
                    <div className="w-12 h-16 bg-slate-950/50 rounded border border-white/10 flex items-center justify-center">
                      <UserCheck className="w-6 h-6 text-blue-500/50" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-500">NOME COMPLETO</div>
                      <div className="text-sm font-mono font-bold text-slate-100">{taskData.idName}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : mission.title === 'Supervisor de Atendimento' ? (
              <div className="p-6 h-full flex flex-col">
                <div className="flex-grow bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-lg">
                  <div className="p-3 border-b border-white/10 bg-slate-950/50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500">LOG_CONVERSA_#99281</span>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                    </div>
                  </div>
                  <div className="p-4 space-y-4 overflow-y-auto flex-grow custom-scrollbar">
                    {taskData.log?.map((msg: any, idx: number) => (
                      <div key={`log-${idx}`} className={`flex flex-col ${msg.speaker === 'Bot' ? 'items-start' : 'items-end'}`}>
                        <span className="text-[10px] text-slate-500 mb-1">{msg.speaker}</span>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-xs shadow-sm ${
                          msg.speaker === 'Bot' ? 'bg-slate-800/80 text-slate-200 rounded-tl-none border border-white/5' : 'bg-blue-600 text-white rounded-tr-none'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : mission.title === 'Auditor de Compliance' ? (
              <div className="p-8 h-full flex flex-col items-center justify-center">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden text-slate-900">
                  <div className="bg-blue-600 p-4 text-white flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    <span className="font-bold text-sm">CryptoAlert Ads</span>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="aspect-video bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      <BarChart3 className="w-12 h-12 text-slate-300" />
                    </div>
                    <p className="text-lg font-black leading-tight tracking-tight">
                      {taskData.adText}
                    </p>
                    <button className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold shadow-lg shadow-blue-900/40">
                      QUERO FICAR RICO AGORA
                    </button>
                  </div>
                </div>
              </div>
            ) : mission.title === 'Treinador de Algoritmos' ? (
              <div className="p-6 h-full flex flex-col gap-4">
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-lg">
                  <span className="text-[10px] text-slate-500 font-bold uppercase mb-2 block">Prompt do Usuário</span>
                  <p className="text-sm text-slate-100 font-medium italic">&quot;{taskData.prompt}&quot;</p>
                </div>
                <div className="grid grid-cols-2 gap-4 flex-grow">
                  <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                    <span className="text-[10px] text-blue-400 font-bold uppercase">Resposta A</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{taskData.responseA}</p>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-4 rounded-xl flex flex-col gap-3 shadow-lg">
                    <span className="text-[10px] text-blue-500 font-bold uppercase">Resposta B</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{taskData.responseB}</p>
                  </div>
                </div>
              </div>
            ) : mission.title === 'Gestor de Tráfego Pago' ? (
              <div className="p-8 h-full flex flex-col items-center justify-center">
                <div className="w-full max-w-sm bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-100">Performance da Campanha</h4>
                    <BarChart3 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1">CTR</div>
                      <div className="text-sm font-bold text-slate-100">{taskData.metrics?.ctr}</div>
                    </div>
                    <div className="text-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1">CPC</div>
                      <div className="text-sm font-bold text-slate-100">{taskData.metrics?.cpc}</div>
                    </div>
                    <div className="text-center p-3 bg-slate-950/50 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-500 mb-1">ROAS</div>
                      <div className="text-sm font-bold text-slate-100">{taskData.metrics?.roas}</div>
                    </div>
                  </div>
                  <div className="h-24 w-full bg-slate-950/50 rounded-xl border border-white/5 flex items-end p-2 gap-1">
                    {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                      <div key={`bar-${i}`} className="flex-1 bg-blue-500/20 border-t-2 border-blue-500 rounded-t-sm" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>
              </div>
            ) : mission.title === 'Moderador de Conteúdo Sênior' ? (
              <div className="p-6 h-full flex flex-col gap-4">
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl shadow-lg">
                  <h4 className="text-xs font-bold text-red-400 uppercase mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Denúncia de Assédio
                  </h4>
                  <p className="text-sm text-slate-200 italic">&quot;{taskData.report}&quot;</p>
                </div>
                <div className="flex-grow bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl p-6 overflow-y-auto custom-scrollbar shadow-lg">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-500" />
                    Termos de Uso (Excerto)
                  </h5>
                  <div className="text-xs text-slate-400 leading-relaxed space-y-4 font-serif">
                    <p>{taskData.termsSnippet}</p>
                    <p>Cláusula 14.3: Em casos de manipulação digital comprovada, o denunciante será penalizado com suspensão de 30 dias por má-fé...</p>
                    <p>Cláusula 14.4: A decisão do moderador sênior é soberana em primeira instância...</p>
                  </div>
                </div>
              </div>
            ) : mission.title === 'Senior Data Analyst' ? (
              <div className="p-6 h-full flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100">Global Revenue Analysis</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Globe className="w-3 h-3" />
                    <span>REGION: GLOBAL</span>
                  </div>
                </div>
                <div className="flex-grow bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 p-8 flex items-end gap-4 shadow-lg">
                  {taskData.chartData?.map((item: any, idx: number) => (
                    <div key={`chart-${idx}`} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-blue-500/20 border-t-2 border-blue-500 rounded-t-sm transition-all hover:bg-blue-500/40" style={{ height: `${(item.value / 250) * 100}%` }} />
                      <span className="text-[10px] font-mono text-slate-500">{item.label}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl">
                  <p className="text-xs text-slate-500 mb-2">Dataset: 2024_FINANCIAL_REPORT.CSV</p>
                  <div className="flex gap-4 text-[10px] font-mono">
                    <span className="text-blue-400">AVG: 165M</span>
                    <span className="text-blue-500">GROWTH: +75%</span>
                  </div>
                </div>
              </div>
            ) : mission.title === 'AI Ethics Officer' ? (
              <div className="p-6 h-full flex flex-col gap-4">
                <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl shadow-lg">
                  <h4 className="text-xs font-bold text-blue-400 uppercase mb-2 flex items-center gap-2">
                    <Bot className="w-4 h-4" />
                    AI Prompt Context
                  </h4>
                  <p className="text-sm text-slate-200 italic">&quot;{taskData.prompt}&quot;</p>
                </div>
                <div className="flex-grow bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl p-6 flex flex-col shadow-lg">
                  <h5 className="text-[10px] font-bold text-slate-500 uppercase mb-4">Model Output Analysis</h5>
                  <div className="bg-slate-950/50 border border-white/5 p-4 rounded-lg text-xs text-slate-300 leading-relaxed flex-grow">
                    {taskData.aiResponse}
                  </div>
                </div>
              </div>
            ) : mission.title === 'Global Content Strategist' ? (
              <div className="p-6 h-full flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4 flex-grow">
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Original (EN-US)</span>
                    <div className="flex-grow bg-slate-900/40 backdrop-blur-md border border-white/10 p-4 rounded-xl text-xs text-slate-200 leading-relaxed shadow-lg">
                      {taskData.original}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] uppercase text-slate-500 font-bold">Translation (PT-BR)</span>
                    <div className="flex-grow bg-slate-900/40 backdrop-blur-md border border-white/10 p-4 rounded-xl text-xs text-slate-200 leading-relaxed shadow-lg">
                      {taskData.translation}
                    </div>
                  </div>
                </div>
                <div className="bg-slate-950/50 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">TARGET TONE:</span>
                    <span className="text-xs font-bold text-slate-100 uppercase">{taskData.tone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500">LOCALE:</span>
                    <span className="text-xs font-bold text-slate-100">BRAZIL</span>
                  </div>
                </div>
              </div>
            ) : mission.title === 'International Support Lead' ? (
              <div className="p-6 h-full flex flex-col">
                <div className="bg-slate-900/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex flex-col h-full shadow-lg">
                  <div className="p-3 border-b border-white/10 bg-slate-950/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-slate-200">LIVE_SUPPORT_US_#102</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{taskData.customerLocation}</span>
                  </div>
                  <div className="p-6 flex-grow flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4 border border-blue-500/30 shadow-xl shadow-blue-900/20">
                      <UserCheck className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mb-2">Incoming High-Priority Ticket</h4>
                    <div className="bg-slate-950/50 border border-white/5 p-4 rounded-lg text-xs text-slate-300 italic mb-6 max-w-sm">
                      &quot;{taskData.ticket}&quot;
                    </div>
                    <div className="flex gap-2 w-full max-w-xs">
                      <button className="flex-1 py-2 bg-slate-800/80 border border-white/10 rounded-lg text-[10px] font-bold uppercase hover:bg-slate-700/80 text-slate-300">View History</button>
                      <button className="flex-1 py-2 bg-blue-600 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40">Open Chat</button>
                    </div>
                  </div>
                </div>
              </div>
            ) : mission.title === 'Quality Assurance Engineer' ? (
              <div className="p-6 h-full flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-100">Automated Checkout Test</h4>
                  <span className="text-[10px] font-mono text-blue-400">STATUS: RUNNING...</span>
                </div>
                <div className="flex-grow bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden flex flex-col shadow-lg">
                  <div className="p-4 bg-slate-950/50 border-b border-white/10 flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                    <div className="w-3 h-3 rounded-full bg-slate-800" />
                  </div>
                  <div className="p-8 space-y-6 overflow-y-auto custom-scrollbar">
                    {taskData.steps?.map((step: any, idx: number) => (
                      <div key={`step-${idx}`} className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            step.status === 'success' ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className="text-xs font-medium text-slate-200">{step.action}</span>
                        </div>
                        <button 
                          onClick={() => setSelectedOption(idx)}
                          className={`px-3 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                            selectedOption === idx 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700/80'
                          }`}
                        >
                          {step.status === 'success' ? 'Passed' : 'Debug'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : mission.type === 'video' ? (
              <VideoTaskRenderer onAttentionCheck={() => {}} />
            ) : mission.type === 'logistics' ? (
              <LogisticsTaskRenderer data={taskData} onUpdate={setLogisticsData} />
            ) : mission.type === 'support' ? (
              <div className="p-8 flex flex-col h-full">
                <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-xl p-6 flex-grow shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                      <UserCheck className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-100">Cliente #4492</div>
                      <div className="text-[10px] text-slate-500">Ticket Aberto há 12min</div>
                    </div>
                  </div>
                  <div className="bg-slate-950/50 rounded-lg p-4 border border-white/5 text-sm text-slate-300 leading-relaxed italic">
                    &quot;{taskData.ticket}&quot;
                  </div>
                </div>
              </div>
            ) : mission.type === 'transcription' ? (
              <AudioTaskRenderer data={taskData} onUpdate={setAudioData} onFinished={setIsAudioFinished} />
            ) : (
              <>
                <Image 
                  src={taskData.imageUrl || "https://picsum.photos/seed/work/800/800"} 
                  alt="Task Content"
                  fill
                  className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  referrerPolicy="no-referrer"
                />
                {mission.type === 'ad' && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950 to-transparent p-6 pt-20">
                    <div className="space-y-4">
                      {taskData.items?.map((item: any, idx: number) => (
                        <div key={`item-${idx}`} className="bg-slate-900/60 backdrop-blur-md border border-white/10 p-3 rounded text-xs text-slate-100 shadow-lg">
                          {item.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right Panel - Workstation */}
        <div className="w-full lg:w-1/2 flex flex-col bg-slate-900/30 relative z-0 lg:overflow-y-auto">
          
          {/* Guidelines Scroll Area */}
          <div className="border-b border-white/10 p-4 lg:p-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              Diretrizes da Tarefa
            </h3>
            
            <div className="space-y-3">
              {taskData.guidelines?.map((guide: string, idx: number) => (
                <div key={`${guide}-${idx}`} className="p-3 rounded-xl bg-slate-950/50 border border-white/5 shadow-sm">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-500 font-mono text-xs mt-0.5">{(idx + 1).toString().padStart(2, '0')}.</span>
                    <p className="text-sm text-slate-300 leading-relaxed">{guide}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action & Checklist Area */}
          <div className="p-4 lg:p-6 flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              Painel de Execução
            </h3>

            <div className="space-y-6 mb-8">
              {mission.title === 'Supervisor de Atendimento' ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-200">Atribua uma nota de qualidade (0-5):</p>
                  <div className="flex justify-between gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button 
                        key={`star-${num}`}
                        onClick={() => setSelectedOption(num)}
                        className={`flex-1 py-4 rounded-xl border transition-all flex flex-col items-center gap-2 min-h-[64px] ${
                          selectedOption === num 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-950/50 border-white/5 text-slate-500 hover:bg-slate-800/50'
                        }`}
                      >
                        <Star className={`w-5 h-5 ${selectedOption === num ? 'fill-blue-500' : ''}`} />
                        <span className="text-xs font-bold">{num}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : mission.title === 'Treinador de Algoritmos' ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-200">Qual resposta é superior?</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setVerdict('A')}
                      className={`p-4 rounded-xl border font-bold transition-all min-h-[56px] ${
                        verdict === 'A' 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-900/20' 
                          : 'bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-800/50'
                      }`}
                    >
                      RESPOSTA A
                    </button>
                    <button 
                      onClick={() => setVerdict('B')}
                      className={`p-4 rounded-xl border font-bold transition-all min-h-[56px] ${
                        verdict === 'B' 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-900/20' 
                          : 'bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-800/50'
                      }`}
                    >
                      RESPOSTA B
                    </button>
                  </div>
                </div>
              ) : mission.title === 'Senior Data Analyst' ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-200">Write your conclusion (English):</p>
                  <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors backdrop-blur-sm"
                    placeholder="Ex: Revenue increased by 10% due to Q4 performance..."
                  />
                </div>
              ) : mission.type === 'support' ? (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-200">Selecione a resposta padrão adequada:</p>
                  <div className="space-y-2">
                    {taskData.options?.map((opt: string, idx: number) => (
                      <button 
                        key={`${opt}-${idx}`}
                        onClick={() => setSelectedOption(idx)}
                        className={`w-full p-4 rounded-xl border text-left text-xs transition-all min-h-[56px] ${
                          selectedOption === idx 
                            ? 'bg-blue-600/20 border-blue-500 text-blue-200 shadow-lg shadow-blue-900/20' 
                            : 'bg-slate-950/50 border-white/5 text-slate-400 hover:bg-slate-800/50'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {mission.type === 'transcription' && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-200">Digite o texto ouvido:</p>
                  <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="w-full h-32 bg-slate-950/50 border border-white/10 rounded-xl p-4 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors backdrop-blur-sm"
                    placeholder="Comece a digitar aqui..."
                  />
                </div>
              )}

              {mission.type === 'audit' && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-200">Extração de Dados da Nota:</p>
                  <div className="grid grid-cols-1 gap-4">
                    <input 
                      type="text"
                      placeholder="Valor Total (ex: 152,40)"
                      className="bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 backdrop-blur-sm"
                      onChange={(e) => setUserInput(prev => prev + e.target.value)}
                    />
                    <input 
                      type="text"
                      placeholder="CNPJ do Emissor"
                      className="bg-slate-950/50 border border-white/10 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500 backdrop-blur-sm"
                      onChange={(e) => setUserInput(prev => prev + e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Standard Verdict for others */}
              {(mission.type === 'ad' || mission.type === 'training' || mission.type === 'video' || mission.type === 'logistics') && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-slate-200">Parecer Final:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setVerdict('approve')}
                      className={`py-4 rounded-xl border font-bold text-[10px] uppercase transition-all flex flex-col items-center gap-2 min-h-[72px] ${
                        verdict === 'approve' 
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400 shadow-lg shadow-blue-900/20' 
                          : 'bg-slate-950/50 border-white/5 text-slate-500 hover:bg-slate-800/50'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      APROVAR
                    </button>
                    <button 
                      onClick={() => setVerdict('block')}
                      className={`py-4 rounded-xl border font-bold text-[10px] uppercase transition-all flex flex-col items-center gap-2 min-h-[72px] ${
                        verdict === 'block' 
                          ? 'bg-red-500/20 border-red-500 text-red-400 shadow-lg shadow-red-900/20' 
                          : 'bg-slate-950/50 border-white/5 text-slate-500 hover:bg-slate-800/50'
                      }`}
                    >
                      <Ban className="w-4 h-4" />
                      BLOQUEAR
                    </button>
                    <button 
                      onClick={() => setVerdict('escalate')}
                      className={`py-4 rounded-xl border font-bold text-[10px] uppercase transition-all flex flex-col items-center gap-2 min-h-[72px] ${
                        verdict === 'escalate' 
                          ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-lg shadow-amber-900/20' 
                          : 'bg-slate-950/50 border-white/5 text-slate-500 hover:bg-slate-800/50'
                      }`}
                    >
                      <AlertOctagon className="w-4 h-4" />
                      ESCALAR
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {showError && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3 backdrop-blur-md"
                >
                  <AlertOctagon className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-200">
                    <strong>Erro de Auditoria:</strong> Revise os dados e tente novamente. Suas respostas não correspondem aos padrões de qualidade da empresa.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <div className="mt-auto pt-8">
              <button
                onClick={submitAudit}
                disabled={isSubmitting}
                className={`w-full py-5 rounded-2xl font-bold text-sm uppercase tracking-widest transition-all shadow-xl min-h-[64px] ${
                  canSubmit()
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/40'
                    : 'bg-slate-800 text-slate-500 border border-white/5 hover:bg-slate-700/50 cursor-pointer'
                }`}
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : !canSubmit() && timeLeft > 0 ? (
                  <>
                    <Lock className="w-4 h-4" />
                    Sincronizando com Servidor ({timeLeft}s)
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    Enviar Trabalho (R$ {mission.value.toFixed(2).replace('.', ',')})
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-slate-900/40 backdrop-blur-2xl border border-white/10 p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-blue-500/30 shadow-xl shadow-blue-900/20">
                <Check className="w-10 h-10 text-blue-500" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Auditoria Aprovada</h2>
              <p className="text-slate-400 mb-6">
                O pagamento de <strong className="text-blue-400 font-bold">R$ {mission.value.toFixed(2).replace('.', ',')}</strong> foi liberado para sua conta.
              </p>
              <div className="w-full bg-slate-950/50 rounded-full h-1.5 overflow-hidden border border-white/5">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2 }}
                  className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-4 uppercase tracking-widest font-mono">Redirecionando...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
